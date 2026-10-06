import React, { useState, useMemo } from 'react';
import { Ruler, Sparkles, Info } from 'lucide-react';

export interface SizeChartEntry {
  size: string;
  chestMin?: number | null;
  chestMax?: number | null;
  chestFormatted?: string | null;
  bustMin?: number | null;
  bustMax?: number | null;
  bustFormatted?: string | null;
  waistMin?: number | null;
  waistMax?: number | null;
  waistFormatted?: string | null;
  hipMin?: number | null;
  hipMax?: number | null;
  hipFormatted?: string | null;
  shoulderMin?: number | null;
  shoulderMax?: number | null;
  shoulderFormatted?: string | null;
  inseamMin?: number | null;
  inseamMax?: number | null;
  inseamFormatted?: string | null;
  heightMin?: number | null;
  heightMax?: number | null;
  heightFormatted?: string | null;
}

export interface SizeChartData {
  id?: number;
  name: string;
  gender: string;
  audience: string;
  category: string;
  unit: string; // IN or CM
  description?: string;
  illustrationType?: string; // MEN_TOP, WOMEN_TOP, MEN_BOTTOM, WOMEN_BOTTOM, KIDS_TOP
  measurementColumns: string[];
  howToMeasure?: Record<string, string>;
  entries: SizeChartEntry[];
}

interface SizeGuideVisualProps {
  chart: SizeChartData;
  onSelectSize?: (size: string) => void;
  onFindMySizeClick?: () => void;
  onSendMessage?: (msg: string) => void;
  highlightSize?: string;
}

export const SizeGuideVisual: React.FC<SizeGuideVisualProps> = ({
  chart,
  onSelectSize,
  onFindMySizeClick,
  onSendMessage,
  highlightSize
}) => {
  const [activeUnit, setActiveUnit] = useState<'IN' | 'CM'>((chart.unit as 'IN' | 'CM') || 'IN');
  const [showHowToMeasure, setShowHowToMeasure] = useState(false);
  const [showFindMySize, setShowFindMySize] = useState(false);
  const [inputMeasurement, setInputMeasurement] = useState<string>('');
  const [measurementType, setMeasurementType] = useState<string>(
    chart.measurementColumns.includes('bust') ? 'bust' :
    chart.measurementColumns.includes('chest') ? 'chest' :
    chart.measurementColumns.includes('waist') ? 'waist' : 'chest'
  );
  const [calculatedRec, setCalculatedRec] = useState<{
    recommendedSize: string;
    confidence: string;
    fit: string;
    range: string;
    userVal: number;
  } | null>(null);

  const INCH_TO_CM = 2.54;

  // Convert entries dynamically between IN and CM
  const convertedEntries = useMemo(() => {
    const isCm = activeUnit === 'CM';
    const originalIsCm = chart.unit === 'CM';

    return chart.entries.map((entry) => {
      const convertVal = (val: number | null | undefined): number | null => {
        if (val == null) return null;
        if (!originalIsCm && isCm) {
          return Math.round(val * INCH_TO_CM * 10) / 10;
        } else if (originalIsCm && !isCm) {
          return Math.round((val / INCH_TO_CM) * 10) / 10;
        }
        return val;
      };

      const formatRange = (min: number | null | undefined, max: number | null | undefined): string | null => {
        const cMin = convertVal(min);
        const cMax = convertVal(max);
        if (cMin == null || cMax == null) return null;
        const suffix = isCm ? ' cm' : '"';
        if (cMin === cMax) return `${cMin}${suffix}`;
        return `${cMin}-${cMax}${suffix}`;
      };

      return {
        ...entry,
        chestDisplay: formatRange(entry.chestMin, entry.chestMax),
        bustDisplay: formatRange(entry.bustMin, entry.bustMax),
        waistDisplay: formatRange(entry.waistMin, entry.waistMax),
        hipDisplay: formatRange(entry.hipMin, entry.hipMax),
        shoulderDisplay: formatRange(entry.shoulderMin, entry.shoulderMax),
        inseamDisplay: formatRange(entry.inseamMin, entry.inseamMax),
        heightDisplay: formatRange(entry.heightMin, entry.heightMax),
        rawMin: (col: string) => convertVal((entry as any)[`${col}Min`]),
        rawMax: (col: string) => convertVal((entry as any)[`${col}Max`]),
      };
    });
  }, [chart, activeUnit]);

  // Handle Find My Size calculation
  const handleCalculateSize = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(inputMeasurement);
    if (isNaN(val) || val <= 0) return;

    // Convert user measurement to match activeUnit
    let bestSize = 'M';
    let minPenalty = 99999;
    let matchedRange = '';

    convertedEntries.forEach((e) => {
      const min = e.rawMin(measurementType);
      const max = e.rawMax(measurementType);
      if (min != null && max != null) {
        let penalty = 0;
        if (val < min) {
          penalty = (min - val) * 2;
        } else if (val > max) {
          penalty = (val - max) * 2;
        } else {
          penalty = Math.abs(val - (min + max) / 2) * 0.1;
        }
        if (penalty < minPenalty) {
          minPenalty = penalty;
          bestSize = e.size;
          matchedRange = `${min}-${max}${activeUnit === 'CM' ? ' cm' : '"'}`;
        }
      }
    });

    setCalculatedRec({
      recommendedSize: bestSize,
      confidence: minPenalty < 0.5 ? 'HIGH' : minPenalty < 2.0 ? 'MEDIUM' : 'LOW',
      fit: minPenalty < 0.3 ? 'Regular' : 'Tailored Fit',
      range: matchedRange,
      userVal: val
    });

    if (onSendMessage) {
      onSendMessage(`My ${measurementType} is ${val} ${activeUnit.toLowerCase()}`);
    }
  };

  const illustrationType = chart.illustrationType || (
    chart.gender === 'WOMEN' ? 'WOMEN_TOP' :
    chart.audience === 'KIDS' ? 'KIDS_TOP' : 'MEN_TOP'
  );

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm my-2 text-neutral-900 transition-all duration-200">
      {/* 1. Header with Title & Unit Toggle */}
      <div className="p-4 bg-neutral-50/70 border-b border-neutral-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center flex-shrink-0">
            <Ruler className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-black">{chart.name}</h4>
            <p className="text-[10px] text-neutral-500 font-medium">
              {chart.gender} • {chart.audience} {chart.description ? `• ${chart.description}` : ''}
            </p>
          </div>
        </div>

        {/* Unit Selector Pills: [CM] [IN] */}
        <div className="inline-flex items-center p-0.5 bg-neutral-200/80 rounded-full text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setActiveUnit('IN')}
            className={`px-2.5 py-1 rounded-full transition cursor-pointer ${
              activeUnit === 'IN'
                ? 'bg-black text-white shadow-xs'
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            IN
          </button>
          <button
            type="button"
            onClick={() => setActiveUnit('CM')}
            className={`px-2.5 py-1 rounded-full transition cursor-pointer ${
              activeUnit === 'CM'
                ? 'bg-black text-white shadow-xs'
                : 'text-neutral-600 hover:text-black'
            }`}
          >
            CM
          </button>
        </div>
      </div>

      {/* 2. Visual Body Silhouette Fashion Diagram */}
      <div className="p-4 bg-gradient-to-b from-neutral-50/40 to-white flex flex-col md:flex-row items-center justify-center gap-6 border-b border-neutral-100">
        <div className="relative w-44 h-48 flex items-center justify-center">
          {/* Men's Top Silhouette */}
          {illustrationType === 'MEN_TOP' && (
            <svg viewBox="0 0 160 180" className="w-full h-full text-neutral-800" fill="none" stroke="currentColor" strokeWidth="1.5">
              {/* Head / Neck */}
              <circle cx="80" cy="22" r="14" strokeWidth="1.75" />
              <path d="M74 36 L74 44 M86 36 L86 44" strokeLinecap="round" />
              {/* Shoulders & Torso */}
              <path d="M42 54 L74 44 L86 44 L118 54 L110 95 L104 150 L56 150 L50 95 Z" strokeWidth="1.5" className="fill-neutral-50/60" />
              {/* Arms */}
              <path d="M42 54 L32 105 M118 54 L128 105" strokeLinecap="round" strokeDasharray="3 3" />

              {/* Measurement Arrows */}
              {/* Shoulder Width Arrow */}
              <g className="text-black">
                <line x1="42" y1="50" x2="118" y2="50" stroke="#000" strokeWidth="1.5" />
                <path d="M45 47 L41 50 L45 53 M115 47 L119 50 L115 53" fill="#000" />
                <text x="80" y="44" textAnchor="middle" className="text-[8px] font-bold fill-black" stroke="none">
                  SHOULDER
                </text>
              </g>

              {/* Chest Arrow */}
              <g className="text-black">
                <line x1="46" y1="78" x2="114" y2="78" stroke="#000" strokeWidth="1.75" />
                <path d="M49 75 L45 78 L49 81 M111 75 L115 78 L111 81" fill="#000" />
                <rect x="62" y="71" width="36" height="13" rx="4" fill="#000" stroke="none" />
                <text x="80" y="80.5" textAnchor="middle" className="text-[7.5px] font-extrabold fill-white" stroke="none">
                  CHEST
                </text>
              </g>

              {/* Waist Arrow */}
              <g className="text-neutral-600">
                <line x1="56" y1="135" x2="104" y2="135" stroke="#555" strokeWidth="1.25" strokeDasharray="2 2" />
                <text x="80" y="145" textAnchor="middle" className="text-[8px] font-semibold fill-neutral-700" stroke="none">
                  WAIST
                </text>
              </g>
            </svg>
          )}

          {/* Women's Top / Dress Silhouette */}
          {(illustrationType === 'WOMEN_TOP' || illustrationType === 'DRESS') && (
            <svg viewBox="0 0 160 180" className="w-full h-full text-neutral-800" fill="none" stroke="currentColor" strokeWidth="1.5">
              {/* Head / Neck */}
              <circle cx="80" cy="22" r="13" strokeWidth="1.75" />
              <path d="M75 35 L75 42 M85 35 L85 42" strokeLinecap="round" />
              {/* Feminine Silhouette */}
              <path d="M48 50 L75 42 L85 42 L112 50 L106 82 Q90 102 70 102 Q54 102 54 82 Z" strokeWidth="1.5" className="fill-neutral-50/60" />
              {/* Dress / Flare lower */}
              <path d="M66 102 L44 165 L116 165 L94 102 Z" strokeWidth="1.5" className="fill-neutral-50/40" />

              {/* Bust Arrow */}
              <g className="text-black">
                <line x1="49" y1="72" x2="111" y2="72" stroke="#000" strokeWidth="1.75" />
                <path d="M52 69 L48 72 L52 75 M108 69 L112 72 L108 75" fill="#000" />
                <rect x="65" y="65" width="30" height="13" rx="4" fill="#000" stroke="none" />
                <text x="80" y="74.5" textAnchor="middle" className="text-[7.5px] font-extrabold fill-white" stroke="none">
                  BUST
                </text>
              </g>

              {/* Waist Arrow */}
              <g className="text-black">
                <line x1="64" y1="102" x2="96" y2="102" stroke="#000" strokeWidth="1.5" />
                <text x="80" y="112" textAnchor="middle" className="text-[7.5px] font-bold fill-black" stroke="none">
                  WAIST
                </text>
              </g>

              {/* Hip Arrow */}
              <g className="text-neutral-600">
                <line x1="52" y1="135" x2="108" y2="135" stroke="#555" strokeWidth="1.25" strokeDasharray="2 2" />
                <text x="80" y="145" textAnchor="middle" className="text-[7.5px] font-semibold fill-neutral-700" stroke="none">
                  HIP
                </text>
              </g>
            </svg>
          )}

          {/* Men's / Women's Bottom Silhouette */}
          {(illustrationType === 'MEN_BOTTOM' || illustrationType === 'WOMEN_BOTTOM') && (
            <svg viewBox="0 0 160 180" className="w-full h-full text-neutral-800" fill="none" stroke="currentColor" strokeWidth="1.5">
              {/* Waistband */}
              <path d="M52 25 L108 25 L112 55 L48 55 Z" className="fill-neutral-50/60" strokeWidth="1.5" />
              {/* Trousers Legs */}
              <path d="M48 55 L44 165 L70 165 L76 75 L84 75 L90 165 L116 165 L112 55 Z" className="fill-neutral-50/40" strokeWidth="1.5" />

              {/* Waist Arrow */}
              <g className="text-black">
                <line x1="50" y1="20" x2="110" y2="20" stroke="#000" strokeWidth="1.75" />
                <path d="M53 17 L49 20 L53 23 M107 17 L111 20 L107 23" fill="#000" />
                <rect x="63" y="13" width="34" height="13" rx="4" fill="#000" stroke="none" />
                <text x="80" y="22.5" textAnchor="middle" className="text-[7.5px] font-extrabold fill-white" stroke="none">
                  WAIST
                </text>
              </g>

              {/* Hip Arrow */}
              <g className="text-black">
                <line x1="46" y1="58" x2="114" y2="58" stroke="#000" strokeWidth="1.5" />
                <text x="80" y="54" textAnchor="middle" className="text-[7.5px] font-bold fill-black" stroke="none">
                  HIP
                </text>
              </g>

              {/* Inseam Arrow */}
              <g className="text-neutral-700">
                <line x1="80" y1="80" x2="80" y2="165" stroke="#333" strokeWidth="1.25" strokeDasharray="3 2" />
                <text x="96" y="125" textAnchor="middle" className="text-[7.5px] font-bold fill-neutral-800" stroke="none">
                  INSEAM
                </text>
              </g>
            </svg>
          )}

          {/* Kids Silhouette */}
          {illustrationType === 'KIDS_TOP' && (
            <svg viewBox="0 0 160 180" className="w-full h-full text-neutral-800" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="80" cy="24" r="16" strokeWidth="1.75" />
              <path d="M54 50 L106 50 L100 110 L60 110 Z" className="fill-neutral-50/60" strokeWidth="1.5" />
              <path d="M60 110 L56 160 M100 110 L104 160" strokeWidth="1.5" />

              {/* Height Indicator */}
              <line x1="26" y1="10" x2="26" y2="160" stroke="#000" strokeWidth="1.5" strokeDasharray="2 2" />
              <text x="18" y="90" textAnchor="middle" className="text-[7.5px] font-extrabold fill-black" stroke="none" transform="rotate(-90 18 90)">
                HEIGHT
              </text>

              {/* Chest Arrow */}
              <line x1="54" y1="72" x2="106" y2="72" stroke="#000" strokeWidth="1.75" />
              <rect x="63" y="65" width="34" height="13" rx="4" fill="#000" stroke="none" />
              <text x="80" y="74.5" textAnchor="middle" className="text-[7.5px] font-extrabold fill-white" stroke="none">
                CHEST
              </text>
            </svg>
          )}
        </div>

        {/* Quick Instructions Text */}
        <div className="flex-1 text-xs space-y-1.5">
          <p className="font-semibold text-neutral-900">
            {illustrationType === 'MEN_TOP' ? 'Chest Measurement' :
             illustrationType === 'WOMEN_TOP' ? 'Bust & Waist Measurements' :
             illustrationType === 'KIDS_TOP' ? 'Height & Age-Group Sizing' : 'Waist & Hip Measurements'}
          </p>
          <p className="text-[11px] text-neutral-600 leading-relaxed">
            {chart.howToMeasure?.Chest ||
             chart.howToMeasure?.Bust ||
             chart.howToMeasure?.Waist ||
             'Measure horizontally with a flexible measuring tape against your body for standard drape.'}
          </p>
          <div className="pt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setShowFindMySize(!showFindMySize);
                onFindMySizeClick?.();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-full text-[11px] font-semibold transition active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              Find My Size
            </button>
            <button
              type="button"
              onClick={() => setShowHowToMeasure(!showHowToMeasure)}
              className="inline-flex items-center gap-1 text-[11px] text-neutral-600 hover:text-black font-medium underline underline-offset-4 cursor-pointer"
            >
              <Info className="w-3 h-3" />
              How to Measure
            </button>
          </div>
        </div>
      </div>

      {/* 3. Inline "Find My Size" Interactive Calculator Drawer */}
      {showFindMySize && (
        <div className="p-4 bg-neutral-50 border-b border-neutral-200 text-xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-neutral-900 text-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-black" />
              Personalized Size Matcher
            </span>
            <button
              type="button"
              onClick={() => setShowFindMySize(false)}
              className="text-[11px] text-neutral-500 hover:text-black cursor-pointer"
            >
              ✕ Close
            </button>
          </div>

          <form onSubmit={handleCalculateSize} className="flex flex-wrap items-center gap-2 mt-2">
            <label className="text-[11px] text-neutral-600 font-medium">Your</label>
            <select
              value={measurementType}
              onChange={(e) => setMeasurementType(e.target.value)}
              className="bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-black focus:outline-none focus:ring-1 focus:ring-black"
            >
              {chart.measurementColumns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.5"
              placeholder={`e.g. ${activeUnit === 'IN' ? '39' : '99'}`}
              value={inputMeasurement}
              onChange={(e) => setInputMeasurement(e.target.value)}
              className="w-24 bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-black focus:outline-none focus:ring-1 focus:ring-black"
              required
            />
            <span className="text-neutral-500 font-bold text-xs">{activeUnit}</span>
            <button
              type="submit"
              className="bg-black hover:bg-neutral-800 text-white px-3.5 py-1.5 rounded-full text-xs font-semibold transition active:scale-95 cursor-pointer ml-auto"
            >
              Calculate Size
            </button>
          </form>

          {calculatedRec && (
            <div className="mt-3 p-3 bg-white border border-neutral-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 text-[11px]">Recommended Size:</span>
                <span className="text-base font-extrabold text-black bg-neutral-100 px-3 py-0.5 rounded-full">
                  {calculatedRec.recommendedSize}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-neutral-500">
                <span>Chart Range: {calculatedRec.range}</span>
                <span>Fit: {calculatedRec.fit}</span>
              </div>
              <p className="text-[10px] text-neutral-400 italic pt-1 border-t border-neutral-100">
                Size recommendations are based on the available size chart. Fit can vary by product, brand, and style.
              </p>
              {onSelectSize && (
                <button
                  type="button"
                  onClick={() => onSelectSize(calculatedRec.recommendedSize)}
                  className="w-full mt-2 bg-black hover:bg-neutral-800 text-white py-1.5 rounded-full font-bold text-[11px] transition text-center cursor-pointer"
                >
                  Select Size {calculatedRec.recommendedSize}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. "How to Measure" Detailed Explanations */}
      {showHowToMeasure && chart.howToMeasure && (
        <div className="p-4 bg-neutral-50/80 border-b border-neutral-200 text-xs space-y-2">
          <h5 className="font-bold text-neutral-900 text-[11px] uppercase tracking-wider">How to Measure:</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
            {Object.entries(chart.howToMeasure).map(([key, desc]) => (
              <div key={key} className="bg-white p-2.5 rounded-lg border border-neutral-100">
                <strong className="text-black font-semibold block">{key}</strong>
                <span className="text-neutral-600 leading-snug">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Clean Monochrome Size Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-neutral-100/70 border-b border-neutral-200 text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
              <th className="py-2.5 px-3">Size</th>
              {chart.measurementColumns.includes('chest') && <th className="py-2.5 px-3">Chest</th>}
              {chart.measurementColumns.includes('bust') && <th className="py-2.5 px-3">Bust</th>}
              {chart.measurementColumns.includes('waist') && <th className="py-2.5 px-3">Waist</th>}
              {chart.measurementColumns.includes('hip') && <th className="py-2.5 px-3">Hip</th>}
              {chart.measurementColumns.includes('shoulder') && <th className="py-2.5 px-3">Shoulder</th>}
              {chart.measurementColumns.includes('inseam') && <th className="py-2.5 px-3">Inseam</th>}
              {chart.measurementColumns.includes('height') && <th className="py-2.5 px-3">Height</th>}
              {onSelectSize && <th className="py-2.5 px-3 text-right">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-[11px]">
            {convertedEntries.map((row, idx) => {
              const isHighlighted = (highlightSize && highlightSize.toUpperCase() === row.size.toUpperCase()) ||
                                   (calculatedRec && calculatedRec.recommendedSize.toUpperCase() === row.size.toUpperCase());

              return (
                <tr
                  key={row.size}
                  className={`transition hover:bg-neutral-50 ${
                    isHighlighted ? 'bg-neutral-100 font-bold' : idx % 2 === 1 ? 'bg-neutral-50/40' : 'bg-white'
                  }`}
                >
                  <td className="py-2.5 px-3 font-extrabold text-black flex items-center gap-1.5">
                    {row.size}
                    {isHighlighted && (
                      <span className="w-1.5 h-1.5 rounded-full bg-black inline-block" title="Recommended" />
                    )}
                  </td>
                  {chart.measurementColumns.includes('chest') && (
                    <td className="py-2.5 px-3 font-mono text-neutral-700">{row.chestDisplay || '—'}</td>
                  )}
                  {chart.measurementColumns.includes('bust') && (
                    <td className="py-2.5 px-3 font-mono text-neutral-700">{row.bustDisplay || '—'}</td>
                  )}
                  {chart.measurementColumns.includes('waist') && (
                    <td className="py-2.5 px-3 font-mono text-neutral-700">{row.waistDisplay || '—'}</td>
                  )}
                  {chart.measurementColumns.includes('hip') && (
                    <td className="py-2.5 px-3 font-mono text-neutral-700">{row.hipDisplay || '—'}</td>
                  )}
                  {chart.measurementColumns.includes('shoulder') && (
                    <td className="py-2.5 px-3 font-mono text-neutral-700">{row.shoulderDisplay || '—'}</td>
                  )}
                  {chart.measurementColumns.includes('inseam') && (
                    <td className="py-2.5 px-3 font-mono text-neutral-700">{row.inseamDisplay || '—'}</td>
                  )}
                  {chart.measurementColumns.includes('height') && (
                    <td className="py-2.5 px-3 font-mono text-neutral-700">{row.heightDisplay || '—'}</td>
                  )}
                  {onSelectSize && (
                    <td className="py-2 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectSize(row.size)}
                        className={`text-[10px] px-2.5 py-1 rounded-full font-semibold transition cursor-pointer ${
                          isHighlighted
                            ? 'bg-black text-white hover:bg-neutral-800'
                            : 'border border-neutral-300 text-neutral-700 hover:border-black hover:text-black'
                        }`}
                      >
                        Select
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 6. Footer disclaimer */}
      <div className="p-2.5 bg-neutral-50/50 border-t border-neutral-100 text-[10px] text-neutral-500 text-center flex items-center justify-center gap-1">
        <span>Units displayed in <strong>{activeUnit}</strong>.</span>
        <span>All measurements reflect body dimensions for garment fit.</span>
      </div>
    </div>
  );
};

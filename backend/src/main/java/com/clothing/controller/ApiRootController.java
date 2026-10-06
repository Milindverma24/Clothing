package com.clothing.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Root Controller for Spring Boot REST API.
 * Provides a status landing page for browser visitors at http://localhost:8080/api and http://localhost:8080/
 * as well as machine-readable JSON status and health checks.
 */
@RestController
public class ApiRootController {

    @GetMapping(value = {"/", "/api", "/api/"})
    public ResponseEntity<?> getRoot(
            @RequestHeader(value = "Accept", required = false, defaultValue = "") String acceptHeader) {
        if (acceptHeader != null && acceptHeader.contains(MediaType.TEXT_HTML_VALUE)) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(buildHtmlLandingPage());
        }
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(buildStatusMap());
    }

    @GetMapping(value = "/api/health")
    public ResponseEntity<Map<String, Object>> getHealth() {
        Map<String, Object> health = new LinkedHashMap<>();
        health.put("status", "UP");
        health.put("service", "clothing-backend");
        health.put("version", "1.0.0");
        health.put("timestamp", Instant.now().toString());
        return ResponseEntity.ok(health);
    }

    private Map<String, Object> buildStatusMap() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("status", "UP");
        response.put("service", "Nova E-Commerce REST API");
        response.put("version", "1.0.0");
        response.put("timestamp", Instant.now().toString());

        Map<String, String> interfaces = new LinkedHashMap<>();
        interfaces.put("storefront", "http://localhost:5173");
        interfaces.put("adminDashboard", "http://localhost:5173/admin");
        interfaces.put("aiChatbotDocs", "http://localhost:8001/docs");
        interfaces.put("h2Console", "http://localhost:8080/h2-console");
        response.put("webInterfaces", interfaces);

        Map<String, String> endpoints = new LinkedHashMap<>();
        endpoints.put("products", "/api/products");
        endpoints.put("search", "/api/products/search?q={query}");
        endpoints.put("collections", "/api/collections");
        endpoints.put("coupons", "/api/coupons");
        endpoints.put("sizeGuides", "/api/size-guides");
        endpoints.put("authLogin", "/api/auth/login");
        endpoints.put("authRegister", "/api/auth/register");
        endpoints.put("aiChat", "/api/chat");
        endpoints.put("orderTracking", "/api/orders/track/{trackingNumber}");
        response.put("publicEndpoints", endpoints);

        return response;
    }

    private String buildHtmlLandingPage() {
        return "<!DOCTYPE html>\n" +
                "<html lang=\"en\">\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "    <title>REST API — Nova Fashion Platform</title>\n" +
                "    <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n" +
                "    <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n" +
                "    <link href=\"https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap\" rel=\"stylesheet\">\n" +
                "    <style>\n" +
                "        :root {\n" +
                "            --bg: #09090b;\n" +
                "            --card-bg: #141416;\n" +
                "            --border: #27272a;\n" +
                "            --text-primary: #f4f4f5;\n" +
                "            --text-secondary: #a1a1aa;\n" +
                "            --accent: #ffffff;\n" +
                "            --accent-green: #22c55e;\n" +
                "        }\n" +
                "        * { box-sizing: border-box; margin: 0; padding: 0; }\n" +
                "        body {\n" +
                "            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;\n" +
                "            background-color: var(--bg);\n" +
                "            color: var(--text-primary);\n" +
                "            display: flex;\n" +
                "            flex-direction: column;\n" +
                "            align-items: center;\n" +
                "            min-height: 100vh;\n" +
                "            padding: 40px 20px;\n" +
                "        }\n" +
                "        .container {\n" +
                "            max-width: 840px;\n" +
                "            width: 100%;\n" +
                "        }\n" +
                "        .brand-title {\n" +
                "            font-family: 'Great Vibes', cursive;\n" +
                "            font-size: 54px;\n" +
                "            font-weight: normal;\n" +
                "            letter-spacing: 1px;\n" +
                "            margin-bottom: 2px;\n" +
                "            color: #ffffff;\n" +
                "        }\n" +
                "        .header {\n" +
                "            display: flex;\n" +
                "            align-items: center;\n" +
                "            justify-content: space-between;\n" +
                "            margin-bottom: 24px;\n" +
                "        }\n" +
                "        .badge {\n" +
                "            display: inline-flex;\n" +
                "            align-items: center;\n" +
                "            gap: 8px;\n" +
                "            background: #18181b;\n" +
                "            border: 1px solid var(--border);\n" +
                "            padding: 6px 14px;\n" +
                "            border-radius: 999px;\n" +
                "            font-size: 13px;\n" +
                "            font-weight: 500;\n" +
                "            color: var(--text-secondary);\n" +
                "        }\n" +
                "        .status-dot {\n" +
                "            width: 8px;\n" +
                "            height: 8px;\n" +
                "            border-radius: 50%;\n" +
                "            background-color: var(--accent-green);\n" +
                "            box-shadow: 0 0 10px var(--accent-green);\n" +
                "        }\n" +
                "        .card {\n" +
                "            background: var(--card-bg);\n" +
                "            border: 1px solid var(--border);\n" +
                "            border-radius: 16px;\n" +
                "            padding: 32px;\n" +
                "            margin-bottom: 24px;\n" +
                "        }\n" +
                "        h1 {\n" +
                "            font-size: 26px;\n" +
                "            font-weight: 600;\n" +
                "            letter-spacing: -0.5px;\n" +
                "            margin-bottom: 8px;\n" +
                "        }\n" +
                "        p.subtitle {\n" +
                "            color: var(--text-secondary);\n" +
                "            font-size: 15px;\n" +
                "            line-height: 1.6;\n" +
                "            margin-bottom: 24px;\n" +
                "        }\n" +
                "        .actions {\n" +
                "            display: flex;\n" +
                "            flex-wrap: wrap;\n" +
                "            gap: 12px;\n" +
                "            margin-bottom: 12px;\n" +
                "        }\n" +
                "        .btn {\n" +
                "            display: inline-flex;\n" +
                "            align-items: center;\n" +
                "            gap: 8px;\n" +
                "            padding: 12px 22px;\n" +
                "            border-radius: 999px;\n" +
                "            font-size: 14px;\n" +
                "            font-weight: 500;\n" +
                "            text-decoration: none;\n" +
                "            transition: all 0.2s ease;\n" +
                "        }\n" +
                "        .btn-primary {\n" +
                "            background: var(--accent);\n" +
                "            color: #000000;\n" +
                "        }\n" +
                "        .btn-primary:hover {\n" +
                "            background: #e4e4e7;\n" +
                "            transform: translateY(-1px);\n" +
                "        }\n" +
                "        .btn-secondary {\n" +
                "            background: #27272a;\n" +
                "            color: #ffffff;\n" +
                "            border: 1px solid #3f3f46;\n" +
                "        }\n" +
                "        .btn-secondary:hover {\n" +
                "            background: #3f3f46;\n" +
                "            transform: translateY(-1px);\n" +
                "        }\n" +
                "        .section-title {\n" +
                "            font-size: 15px;\n" +
                "            font-weight: 600;\n" +
                "            text-transform: uppercase;\n" +
                "            letter-spacing: 0.5px;\n" +
                "            color: var(--text-secondary);\n" +
                "            margin: 28px 0 16px;\n" +
                "        }\n" +
                "        .endpoints-grid {\n" +
                "            display: grid;\n" +
                "            gap: 10px;\n" +
                "        }\n" +
                "        .endpoint-row {\n" +
                "            display: flex;\n" +
                "            align-items: center;\n" +
                "            justify-content: space-between;\n" +
                "            padding: 12px 16px;\n" +
                "            background: #18181b;\n" +
                "            border: 1px solid #27272a;\n" +
                "            border-radius: 10px;\n" +
                "            text-decoration: none;\n" +
                "            color: var(--text-primary);\n" +
                "            transition: border-color 0.15s ease;\n" +
                "        }\n" +
                "        .endpoint-row:hover {\n" +
                "            border-color: #52525b;\n" +
                "        }\n" +
                "        .method {\n" +
                "            font-size: 12px;\n" +
                "            font-weight: 700;\n" +
                "            padding: 3px 8px;\n" +
                "            border-radius: 4px;\n" +
                "            margin-right: 12px;\n" +
                "            background: #22c55e22;\n" +
                "            color: #4ade80;\n" +
                "        }\n" +
                "        .path {\n" +
                "            font-family: monospace;\n" +
                "            font-size: 13px;\n" +
                "        }\n" +
                "        .desc {\n" +
                "            color: var(--text-secondary);\n" +
                "            font-size: 13px;\n" +
                "        }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"container\">\n" +
                "        <div class=\"header\">\n" +
                "            <div class=\"badge\"><span class=\"status-dot\"></span> Nova API 3.3.4 &bull; Running on Port 8080</div>\n" +
                "            <a href=\"/api/health\" class=\"badge\" style=\"text-decoration: none;\">Health: UP</a>\n" +
                "        </div>\n" +
                "        <div class=\"card\">\n" +
                "            <div class=\"brand-title\">Nova</div>\n" +
                "            <h1 style=\"font-size: 18px; color: var(--text-secondary); font-weight: 500; margin-bottom: 12px;\">REST API Engine &bull; Port 8080</h1>\n" +
                "            <p class=\"subtitle\">\n" +
                "                You have reached the backend REST API endpoint for Nova at <code>http://localhost:8080/api</code>.<br/>\n" +
                "                To view the interactive consumer application, open the React Storefront below:\n" +
                "            </p>\n" +
                "            <div class=\"actions\">\n" +
                "                <a href=\"http://localhost:5173\" class=\"btn btn-primary\">🛍️ Open Nova Storefront (Port 5173)</a>\n" +
                "                <a href=\"http://localhost:5173/admin\" class=\"btn btn-secondary\">🛡️ Admin Dashboard</a>\n" +
                "                <a href=\"/api/products\" class=\"btn btn-secondary\">📦 Browse Products API</a>\n" +
                "                <a href=\"http://localhost:8001/docs\" class=\"btn btn-secondary\" target=\"_blank\">🤖 AI ChatBot Docs</a>\n" +
                "                <a href=\"/h2-console\" class=\"btn btn-secondary\">🗄️ H2 Database Console</a>\n" +
                "            </div>\n" +
                "            <div class=\"section-title\">Public API Endpoints</div>\n" +
                "            <div class=\"endpoints-grid\">\n" +
                "                <a href=\"/api/products\" class=\"endpoint-row\">\n" +
                "                    <div><span class=\"method\">GET</span><span class=\"path\">/api/products</span></div>\n" +
                "                    <span class=\"desc\">Browse 300 catalog products (paginated) &rarr;</span>\n" +
                "                </a>\n" +
                "                <a href=\"/api/products/search?q=jacket\" class=\"endpoint-row\">\n" +
                "                    <div><span class=\"method\">GET</span><span class=\"path\">/api/products/search?q=jacket</span></div>\n" +
                "                    <span class=\"desc\">Instant catalog full-text search &rarr;</span>\n" +
                "                </a>\n" +
                "                <a href=\"/api/coupons\" class=\"endpoint-row\">\n" +
                "                    <div><span class=\"method\">GET</span><span class=\"path\">/api/coupons</span></div>\n" +
                "                    <span class=\"desc\">View active promo coupons (e.g. WELCOME10) &rarr;</span>\n" +
                "                </a>\n" +
                "                <a href=\"/api/size-guides/categories\" class=\"endpoint-row\">\n" +
                "                    <div><span class=\"method\">GET</span><span class=\"path\">/api/size-guides/categories</span></div>\n" +
                "                    <span class=\"desc\">Size charts for Men, Women, Kids &rarr;</span>\n" +
                "                </a>\n" +
                "                <a href=\"/api/health\" class=\"endpoint-row\">\n" +
                "                    <div><span class=\"method\">GET</span><span class=\"path\">/api/health</span></div>\n" +
                "                    <span class=\"desc\">System health check JSON &rarr;</span>\n" +
                "                </a>\n" +
                "            </div>\n" +
                "        </div>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }
}

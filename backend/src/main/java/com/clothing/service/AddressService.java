package com.clothing.service;

import com.clothing.dto.AddressDto;
import com.clothing.entity.Address;
import com.clothing.entity.User;
import com.clothing.exception.ApiException;
import com.clothing.repository.AddressRepository;
import com.clothing.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    public AddressService(AddressRepository addressRepository, UserRepository userRepository) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<AddressDto> getUserAddresses(Long userId) {
        return addressRepository.findAllByUserIdOrderByIsDefaultShippingDescCreatedAtDesc(userId)
            .stream()
            .map(AddressDto::fromEntity)
            .collect(Collectors.toList());
    }

    @Transactional
    public AddressDto createAddress(Long userId, AddressDto dto) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ApiException("User not found"));

        List<Address> existing = addressRepository.findAllByUserIdOrderByIsDefaultShippingDescCreatedAtDesc(userId);

        Address address = new Address();
        address.setUser(user);
        address.setFullName(dto.getFullName());
        address.setPhone(dto.getPhone());
        address.setAddressLine1(dto.getAddressLine1());
        address.setAddressLine2(dto.getAddressLine2());
        address.setCity(dto.getCity());
        address.setState(dto.getState());
        address.setPostalCode(dto.getPostalCode());
        address.setCountry(dto.getCountry() != null ? dto.getCountry() : "India");
        address.setAddressType(dto.getAddressType() != null ? dto.getAddressType() : "HOME");

        // If first address or marked default, clear other defaults
        if (existing.isEmpty() || Boolean.TRUE.equals(dto.getIsDefaultShipping())) {
            if (Boolean.TRUE.equals(dto.getIsDefaultShipping())) {
                existing.forEach(a -> a.setIsDefaultShipping(false));
                addressRepository.saveAll(existing);
            }
            address.setIsDefaultShipping(true);
        } else {
            address.setIsDefaultShipping(false);
        }

        if (existing.isEmpty() || Boolean.TRUE.equals(dto.getIsDefaultBilling())) {
            if (Boolean.TRUE.equals(dto.getIsDefaultBilling())) {
                existing.forEach(a -> a.setIsDefaultBilling(false));
                addressRepository.saveAll(existing);
            }
            address.setIsDefaultBilling(true);
        } else {
            address.setIsDefaultBilling(false);
        }

        address = addressRepository.save(address);
        return AddressDto.fromEntity(address);
    }

    @Transactional
    public AddressDto updateAddress(Long userId, Long addressId, AddressDto dto) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
            .orElseThrow(() -> new ApiException("Address not found or unauthorized"));

        address.setFullName(dto.getFullName());
        address.setPhone(dto.getPhone());
        address.setAddressLine1(dto.getAddressLine1());
        address.setAddressLine2(dto.getAddressLine2());
        address.setCity(dto.getCity());
        address.setState(dto.getState());
        address.setPostalCode(dto.getPostalCode());
        address.setCountry(dto.getCountry() != null ? dto.getCountry() : "India");
        address.setAddressType(dto.getAddressType() != null ? dto.getAddressType() : "HOME");
        address.setUpdatedAt(LocalDateTime.now());

        if (Boolean.TRUE.equals(dto.getIsDefaultShipping())) {
            List<Address> all = addressRepository.findAllByUserIdOrderByIsDefaultShippingDescCreatedAtDesc(userId);
            all.forEach(a -> {
                if (!a.getId().equals(addressId)) a.setIsDefaultShipping(false);
            });
            addressRepository.saveAll(all);
            address.setIsDefaultShipping(true);
        }

        if (Boolean.TRUE.equals(dto.getIsDefaultBilling())) {
            List<Address> all = addressRepository.findAllByUserIdOrderByIsDefaultShippingDescCreatedAtDesc(userId);
            all.forEach(a -> {
                if (!a.getId().equals(addressId)) a.setIsDefaultBilling(false);
            });
            addressRepository.saveAll(all);
            address.setIsDefaultBilling(true);
        }

        address = addressRepository.save(address);
        return AddressDto.fromEntity(address);
    }

    @Transactional
    public void deleteAddress(Long userId, Long addressId) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
            .orElseThrow(() -> new ApiException("Address not found or unauthorized"));

        addressRepository.delete(address);
    }

    @Transactional
    public void setDefaultShipping(Long userId, Long addressId) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
            .orElseThrow(() -> new ApiException("Address not found or unauthorized"));

        List<Address> all = addressRepository.findAllByUserIdOrderByIsDefaultShippingDescCreatedAtDesc(userId);
        all.forEach(a -> a.setIsDefaultShipping(a.getId().equals(addressId)));
        addressRepository.saveAll(all);
    }
}

package com.clothing.dto;

import com.clothing.entity.Address;
import jakarta.validation.constraints.NotBlank;

public class AddressDto {
    private Long id;

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Phone number is required")
    private String phone;

    @NotBlank(message = "Address line 1 is required")
    private String addressLine1;

    private String addressLine2;

    @NotBlank(message = "City is required")
    private String city;

    @NotBlank(message = "State is required")
    private String state;

    @NotBlank(message = "Postal code is required")
    private String postalCode;

    private String country = "India";
    private String addressType = "HOME";
    private Boolean isDefaultShipping = false;
    private Boolean isDefaultBilling = false;

    public AddressDto() {}

    public static AddressDto fromEntity(Address a) {
        AddressDto dto = new AddressDto();
        dto.setId(a.getId());
        dto.setFullName(a.getFullName());
        dto.setPhone(a.getPhone());
        dto.setAddressLine1(a.getAddressLine1());
        dto.setAddressLine2(a.getAddressLine2());
        dto.setCity(a.getCity());
        dto.setState(a.getState());
        dto.setPostalCode(a.getPostalCode());
        dto.setCountry(a.getCountry());
        dto.setAddressType(a.getAddressType());
        dto.setIsDefaultShipping(a.getIsDefaultShipping());
        dto.setIsDefaultBilling(a.getIsDefaultBilling());
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddressLine1() { return addressLine1; }
    public void setAddressLine1(String addressLine1) { this.addressLine1 = addressLine1; }

    public String getAddressLine2() { return addressLine2; }
    public void setAddressLine2(String addressLine2) { this.addressLine2 = addressLine2; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getAddressType() { return addressType; }
    public void setAddressType(String addressType) { this.addressType = addressType; }

    public Boolean getIsDefaultShipping() { return isDefaultShipping; }
    public void setIsDefaultShipping(Boolean defaultShipping) { isDefaultShipping = defaultShipping; }

    public Boolean getIsDefaultBilling() { return isDefaultBilling; }
    public void setIsDefaultBilling(Boolean defaultBilling) { isDefaultBilling = defaultBilling; }
}

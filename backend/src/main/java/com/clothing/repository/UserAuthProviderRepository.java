package com.clothing.repository;

import com.clothing.entity.User;
import com.clothing.entity.UserAuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserAuthProviderRepository extends JpaRepository<UserAuthProvider, Long> {
    Optional<UserAuthProvider> findByProviderAndProviderUserId(String provider, String providerUserId);
    Optional<UserAuthProvider> findByUserAndProvider(User user, String provider);
    List<UserAuthProvider> findAllByUser(User user);
    void deleteByUserAndProvider(User user, String provider);
}

package com.elmayorista.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {

    public static final String USERS_CACHE = "users";
    public static final String DASHBOARD_STATS_CACHE = "dashboardStats";
    public static final String COMMISSION_STATS_CACHE = "commissionStats";

    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager(
                USERS_CACHE,
                DASHBOARD_STATS_CACHE,
                COMMISSION_STATS_CACHE
        );
    }
}

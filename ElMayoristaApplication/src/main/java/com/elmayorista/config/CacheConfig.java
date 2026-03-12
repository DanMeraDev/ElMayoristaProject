package com.elmayorista.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;

import java.time.Duration;
import java.util.Map;

@Configuration
@EnableCaching
public class CacheConfig {

    public static final String USERS_CACHE = "users";
    public static final String DASHBOARD_STATS_CACHE = "dashboardStats";
    public static final String COMMISSION_STATS_CACHE = "commissionStats";
    public static final String UNREAD_COUNT_CACHE = "unreadCount";
    public static final String RANKING_CACHE = "ranking";

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(
                                new GenericJackson2JsonRedisSerializer()))
                .disableCachingNullValues();

        Map<String, RedisCacheConfiguration> cacheConfigs = Map.of(
                USERS_CACHE, defaultConfig.entryTtl(Duration.ofMinutes(10)),
                DASHBOARD_STATS_CACHE, defaultConfig.entryTtl(Duration.ofMinutes(5)),
                COMMISSION_STATS_CACHE, defaultConfig.entryTtl(Duration.ofMinutes(5)),
                UNREAD_COUNT_CACHE, defaultConfig.entryTtl(Duration.ofSeconds(30)),
                RANKING_CACHE, defaultConfig.entryTtl(Duration.ofMinutes(10))
        );

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig.entryTtl(Duration.ofMinutes(5)))
                .withInitialCacheConfigurations(cacheConfigs)
                .build();
    }
}

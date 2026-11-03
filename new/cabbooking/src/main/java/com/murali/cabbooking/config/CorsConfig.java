package com.murali.cabbooking.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:3001}")
    private String allowedOrigins;

    @Bean
    public WebMvcConfigurer corsConfigurer() {

        return new WebMvcConfigurer() {

            @Override
            public void addCorsMappings(CorsRegistry registry) {

                String[] configuredOrigins = Arrays.stream(allowedOrigins.split(","))
                        .map(String::trim)
                        .filter(origin -> !origin.isEmpty())
                        .toArray(String[]::new);

                registry.addMapping("/**")
                        .allowedOriginPatterns(
                                "http://localhost:*",
                                "http://127.0.0.1:*",
                                "http://[::1]:*",
                                "http://192.168.*:[*]",
                                "http://10.*:[*]",
                                "http://172.16.*:[*]",
                                "http://172.17.*:[*]",
                                "http://172.18.*:[*]",
                                "http://172.19.*:[*]",
                                "http://172.20.*:[*]",
                                "http://172.21.*:[*]",
                                "http://172.22.*:[*]",
                                "http://172.23.*:[*]",
                                "http://172.24.*:[*]",
                                "http://172.25.*:[*]",
                                "http://172.26.*:[*]",
                                "http://172.27.*:[*]",
                                "http://172.28.*:[*]",
                                "http://172.29.*:[*]",
                                "http://172.30.*:[*]",
                                "http://172.31.*:[*]"
                        )
                        .allowedOrigins(configuredOrigins)
                        .allowedMethods("*")
                        .allowedHeaders("*");

            }

        };

    }

}
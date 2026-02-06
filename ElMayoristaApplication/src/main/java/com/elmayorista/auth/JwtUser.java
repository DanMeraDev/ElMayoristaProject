package com.elmayorista.auth;

import com.elmayorista.user.Role;

import java.util.Set;

/**
 * Interfaz que extiende UserDetails para incluir información adicional
 * necesaria para la generación de tokens JWT
 */
public interface JwtUser {
    
    /**
     * Obtiene los roles del usuario para incluirlos en el token JWT
     * @return Conjunto de roles del usuario
     */
    Set<Role> getRoles();
}

package com.elmayorista.verification;

/**
 * Validación matemática de documentos de identidad ecuatorianos.
 * No requiere API externa: usa los algoritmos oficiales del Registro Civil y el SRI.
 */
public class EcuadorIdValidator {

    public record ValidationResult(boolean valid, String type) {}

    // ─── Cédula (10 dígitos, personas naturales) ──────────────────────────────

    public static ValidationResult validateCedula(String cedula) {
        if (cedula == null || !cedula.matches("\\d{10}")) {
            return new ValidationResult(false, "UNKNOWN");
        }

        int province = Integer.parseInt(cedula.substring(0, 2));
        if (province < 1 || province > 24) {
            return new ValidationResult(false, "UNKNOWN");
        }

        int thirdDigit = cedula.charAt(2) - '0';
        if (thirdDigit > 5) {
            // 6 = entidad pública, 9 = sociedad privada → no son cédulas
            return new ValidationResult(false, "UNKNOWN");
        }

        int[] coefficients = {2, 1, 2, 1, 2, 1, 2, 1, 2};
        int sum = 0;
        for (int i = 0; i < 9; i++) {
            int product = (cedula.charAt(i) - '0') * coefficients[i];
            if (product > 9) product -= 9;
            sum += product;
        }

        int verifier = (10 - (sum % 10)) % 10;
        boolean valid = verifier == (cedula.charAt(9) - '0');
        return new ValidationResult(valid, valid ? "CEDULA" : "UNKNOWN");
    }

    // ─── RUC (13 dígitos, tres tipos) ─────────────────────────────────────────

    public static ValidationResult validateRuc(String ruc) {
        if (ruc == null || !ruc.matches("\\d{13}")) {
            return new ValidationResult(false, "UNKNOWN");
        }

        int province = Integer.parseInt(ruc.substring(0, 2));
        if (province < 1 || province > 24) {
            return new ValidationResult(false, "UNKNOWN");
        }

        int thirdDigit = ruc.charAt(2) - '0';

        if (thirdDigit <= 5) {
            return validateRucNaturalPerson(ruc);
        } else if (thirdDigit == 6) {
            return validateRucPublicEntity(ruc);
        } else if (thirdDigit == 9) {
            return validateRucPrivateCompany(ruc);
        }

        return new ValidationResult(false, "UNKNOWN");
    }

    /** RUC persona natural: primeros 10 = cédula válida + establecimiento 001-999 */
    private static ValidationResult validateRucNaturalPerson(String ruc) {
        ValidationResult cedulaCheck = validateCedula(ruc.substring(0, 10));
        if (!cedulaCheck.valid()) return new ValidationResult(false, "UNKNOWN");
        String establishment = ruc.substring(10, 13);
        if ("000".equals(establishment)) return new ValidationResult(false, "UNKNOWN");
        return new ValidationResult(true, "RUC");
    }

    /** RUC entidad pública (3er dígito = 6): módulo 11 con coeficientes [3,2,7,6,5,4,3,2] */
    private static ValidationResult validateRucPublicEntity(String ruc) {
        int[] coefficients = {3, 2, 7, 6, 5, 4, 3, 2};
        int sum = 0;
        for (int i = 0; i < 8; i++) {
            sum += (ruc.charAt(i) - '0') * coefficients[i];
        }
        int remainder = sum % 11;
        int verifier = remainder == 0 ? 0 : 11 - remainder;
        if (verifier == 10) return new ValidationResult(false, "UNKNOWN"); // resultado inválido
        boolean valid = verifier == (ruc.charAt(8) - '0');
        return new ValidationResult(valid, valid ? "RUC" : "UNKNOWN");
    }

    /** RUC sociedad privada/extranjera (3er dígito = 9): módulo 11 con coeficientes [4,3,2,7,6,5,4,3,2] */
    private static ValidationResult validateRucPrivateCompany(String ruc) {
        int[] coefficients = {4, 3, 2, 7, 6, 5, 4, 3, 2};
        int sum = 0;
        for (int i = 0; i < 9; i++) {
            sum += (ruc.charAt(i) - '0') * coefficients[i];
        }
        int remainder = sum % 11;
        int verifier = remainder == 0 ? 0 : 11 - remainder;
        if (verifier == 10) return new ValidationResult(false, "UNKNOWN");
        String establishment = ruc.substring(10, 13);
        if ("000".equals(establishment)) return new ValidationResult(false, "UNKNOWN");
        boolean valid = verifier == (ruc.charAt(9) - '0');
        return new ValidationResult(valid, valid ? "RUC" : "UNKNOWN");
    }
}

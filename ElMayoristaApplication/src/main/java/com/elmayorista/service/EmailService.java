package com.elmayorista.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from}")
    private String fromEmail;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    private String getLogoUrl() {
        return frontendUrl + "/logo-compact.png";
    }

    /**
     * Builds the common email wrapper: gray background, white card, red header with logo, footer.
     * The 'bodyContent' is injected inside the white card below the header.
     */
    private String buildEmailTemplate(String bodyContent) {
        String logoUrl = getLogoUrl();
        return String.format(
                """
                <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f0f0f0; padding: 30px 10px; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                        <div style="background-color: #ef1d26; padding: 30px 20px; text-align: center;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%%%%">
                                <tr>
                                    <td align="center">
                                        <div style="display: inline-block; background-color: #ffffff; border-radius: 50%%%%; padding: 12px; line-height: 0;">
                                            <img src="%s" alt="El Mayorista" style="display: block; width: 60px; height: 60px; border-radius: 50%%%%; object-fit: contain;">
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </div>
                        %s
                        <div style="background-color: #2d2d2d; padding: 20px; text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: #aaa;">&copy; 2026 El Mayorista. Todos los derechos reservados.</p>
                        </div>
                    </div>
                </div>
                """,
                logoUrl, bodyContent);
    }

    @Async
    public void sendPasswordResetEmail(String to, String token) {
        String subject = "Restablecer Contraseña - El Mayorista";
        String resetLink = frontendUrl + "/reset-password?token=" + token;

        String body = String.format(
                """
                <div style="padding: 30px;">
                    <h2 style="color: #ef1d26; margin-top: 0;">Recuperación de Contraseña</h2>
                    <p style="font-size: 16px; line-height: 1.5; color: #555;">Hola,</p>
                    <p style="font-size: 16px; line-height: 1.5; color: #555;">Hemos recibido una solicitud para restablecer tu contraseña. Si fuiste tú, haz clic en el siguiente botón:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="%s" style="background-color: #ef1d26; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Restablecer Contraseña</a>
                    </div>
                    <p style="font-size: 14px; color: #888; margin-top: 20px;">Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
                    <p style="font-size: 14px; color: #888;">El enlace expirará en 1 hora.</p>
                </div>
                """,
                resetLink);

        sendHtmlEmail(to, subject, buildEmailTemplate(body));
    }

    @Async
    public void sendVendorApprovalEmail(String to, String name) {
        String subject = "¡Tu cuenta ha sido APROBADA! - El Mayorista";
        String loginLink = frontendUrl + "/login";

        String body = String.format(
                """
                <div style="padding: 30px;">
                    <h2 style="color: #ef1d26; margin-top: 0;">¡Bienvenido al equipo, %s!</h2>
                    <p style="font-size: 16px; line-height: 1.5; color: #555;">Nos complace informarte que tu solicitud para ser vendedor ha sido <strong>APROBADA</strong>.</p>
                    <p style="font-size: 16px; line-height: 1.5; color: #555;">Ahora tienes acceso completo a tu panel de vendedor donde podrás gestionar tus ventas y comisiones.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="%s" style="background-color: #ef1d26; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Ingresar a mi Cuenta</a>
                    </div>
                    <p style="font-size: 16px; line-height: 1.5; color: #555;">¡Esperamos que tengas muchas ventas exitosas!</p>
                </div>
                """,
                name, loginLink);

        sendHtmlEmail(to, subject, buildEmailTemplate(body));
    }

    @Async
    public void sendVendorRejectionEmail(String to, String name, String reason) {
        String subject = "Actualización sobre tu solicitud - El Mayorista";

        String body = String.format(
                """
                <div style="padding: 30px;">
                    <h2 style="color: #333; margin-top: 0;">Hola, %s</h2>
                    <p style="font-size: 16px; line-height: 1.5; color: #555;">Gracias por tu interés en unirte a El Mayorista.</p>
                    <div style="background-color: #fff0f0; border-left: 4px solid #ef1d26; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                        <p style="margin: 0; color: #d32f2f; font-weight: bold;">Solicitud No Aprobada</p>
                        <p style="margin: 5px 0 0 0; color: #555;">%s</p>
                    </div>
                    <p style="font-size: 16px; line-height: 1.5; color: #555;">Si consideras que esto es un error o deseas volver a intentarlo una vez corregido el problema, por favor regístrate nuevamente o contacta a soporte.</p>
                </div>
                """,
                name, reason != null ? reason : "No cumple con los requisitos actuales.");

        sendHtmlEmail(to, subject, buildEmailTemplate(body));
    }

    @Async
    public void sendSupportTicketNotification(String adminEmail, String ticketType, String subject, String description,
            String sellerName, String sellerEmail) {
        String emailSubject = "Nuevo Ticket de Soporte - " + ticketType;

        String typeLabel = switch (ticketType) {
            case "BUG" -> "Bug";
            case "RECOMMENDATION" -> "Recomendación";
            default -> "Otro";
        };

        String body = String.format(
                """
                <div style="padding: 30px;">
                    <h2 style="color: #ef1d26; margin-top: 0;">Nuevo Ticket de Soporte</h2>
                    <div style="background-color: #f5f5f5; border-left: 4px solid #ef1d26; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                        <p style="margin: 0; font-weight: bold; color: #333;">Tipo: %s</p>
                    </div>
                    <div style="margin: 20px 0;">
                        <p style="font-weight: bold; color: #333; margin-bottom: 5px;">Asunto:</p>
                        <p style="font-size: 16px; color: #555; margin-top: 0;">%s</p>
                    </div>
                    <div style="margin: 20px 0;">
                        <p style="font-weight: bold; color: #333; margin-bottom: 5px;">Descripción:</p>
                        <p style="font-size: 14px; color: #555; margin-top: 0; line-height: 1.5;">%s</p>
                    </div>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="font-weight: bold; color: #333; margin: 0 0 5px 0;">Reportado por:</p>
                        <p style="margin: 0; color: #555;">%s</p>
                        <p style="margin: 5px 0 0 0; color: #888; font-size: 14px;">%s</p>
                    </div>
                    <p style="font-size: 14px; color: #888; margin-top: 30px;">Este ticket requiere tu atención. Por favor, ingresa al panel de administración para responder.</p>
                </div>
                """,
                typeLabel, subject, description, sellerName, sellerEmail);

        sendHtmlEmail(adminEmail, emailSubject, buildEmailTemplate(body));
    }

    @Async
    public void sendPendingSaleReminderToSeller(String to, String sellerName, String orderNumber,
            String customerName, String total, long daysPending) {
        String subject = "Recordatorio: Venta " + orderNumber + " pendiente de pago - " + daysPending + " dias";
        String salesLink = frontendUrl + "/seller/ventas";

        String body = String.format(
                """
                <div style="padding: 30px;">
                    <h2 style="color: #ef1d26; margin-top: 0;">Recordatorio de Venta Pendiente</h2>
                    <p style="font-size: 16px; line-height: 1.5; color: #555;">Hola %s,</p>
                    <p style="font-size: 16px; line-height: 1.5; color: #555;">Te recordamos que la siguiente venta lleva <strong>%d dias</strong> sin recibir pago:</p>
                    <div style="background-color: #fff8f0; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                        <table style="width: 100%%%%; border-collapse: collapse;">
                            <tr><td style="padding: 4px 0; color: #888; font-size: 14px;">Orden:</td><td style="padding: 4px 0; font-weight: bold; color: #333;">%s</td></tr>
                            <tr><td style="padding: 4px 0; color: #888; font-size: 14px;">Cliente:</td><td style="padding: 4px 0; font-weight: bold; color: #333;">%s</td></tr>
                            <tr><td style="padding: 4px 0; color: #888; font-size: 14px;">Monto:</td><td style="padding: 4px 0; font-weight: bold; color: #ef1d26; font-size: 18px;">$%s</td></tr>
                        </table>
                    </div>
                    <p style="font-size: 14px; line-height: 1.5; color: #555;">Por favor, gestiona el cobro lo antes posible para evitar demoras en tus comisiones.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="%s" style="background-color: #ef1d26; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Ver Mis Ventas</a>
                    </div>
                </div>
                """,
                sellerName, daysPending, orderNumber, customerName, total, salesLink);

        sendHtmlEmail(to, subject, buildEmailTemplate(body));
    }

    @Async
    public void sendPendingSaleAlertToAdmin(String to, String sellerName, String sellerEmail,
            String orderNumber, String customerName, String total, long daysPending) {
        String subject = "ALERTA: Venta " + orderNumber + " lleva " + daysPending + " dias sin pagar";
        String reviewLink = frontendUrl + "/admin/sales-review";

        String body = String.format(
                """
                <div style="padding: 30px;">
                    <h2 style="color: #d32f2f; margin-top: 0;">Alerta: Venta Sin Pagar</h2>
                    <p style="font-size: 16px; line-height: 1.5; color: #555;">La siguiente venta lleva <strong style="color: #d32f2f;">%d dias</strong> sin recibir pago y requiere su atencion:</p>
                    <div style="background-color: #fff0f0; border-left: 4px solid #d32f2f; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                        <table style="width: 100%%%%; border-collapse: collapse;">
                            <tr><td style="padding: 4px 0; color: #888; font-size: 14px;">Orden:</td><td style="padding: 4px 0; font-weight: bold; color: #333;">%s</td></tr>
                            <tr><td style="padding: 4px 0; color: #888; font-size: 14px;">Cliente:</td><td style="padding: 4px 0; font-weight: bold; color: #333;">%s</td></tr>
                            <tr><td style="padding: 4px 0; color: #888; font-size: 14px;">Monto:</td><td style="padding: 4px 0; font-weight: bold; color: #d32f2f; font-size: 18px;">$%s</td></tr>
                        </table>
                    </div>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="font-weight: bold; color: #333; margin: 0 0 5px 0;">Vendedor responsable:</p>
                        <p style="margin: 0; color: #555;">%s</p>
                        <p style="margin: 5px 0 0 0; color: #888; font-size: 14px;">%s</p>
                    </div>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="%s" style="background-color: #d32f2f; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Revisar Ventas</a>
                    </div>
                </div>
                """,
                daysPending, orderNumber, customerName, total, sellerName, sellerEmail, reviewLink);

        sendHtmlEmail(to, subject, buildEmailTemplate(body));
    }

    private void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Error enviando email a " + to + ": " + e.getMessage());
        }
    }
}

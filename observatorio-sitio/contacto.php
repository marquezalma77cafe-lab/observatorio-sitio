<?php
/* ==============================================
   OBSERVATORIO SOBRE DERECHO DE GÉNERO
   Y SEGURIDAD JURÍDICA
   Backend del formulario de contacto
   ----------------------------------------------
   Envía el mensaje a:
     - a_marquez@uadec.edu.mx
     - margarita-guajardo@uadec.edu.mx
   ============================================== */

header('Content-Type: application/json; charset=utf-8');

// ---- Configuración ----
$destinatarios = [
    'a_marquez@uadec.edu.mx',
    'margarita-guajardo@uadec.edu.mx'
];

// Dirección remitente del servidor (Hostinger acepta el dominio del hosting)
// Si tu dominio es ejemplo.com, usa por ejemplo: contacto@ejemplo.com
$remitente_email = 'contacto@' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
$remitente_nombre = 'Observatorio - Formulario web';

// ---- Solo aceptar POST ----
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Método no permitido']);
    exit;
}

// ---- Leer datos (JSON o POST tradicional) ----
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = $_POST;
}

// ---- Sanear ----
function clean($s) {
    return trim(strip_tags((string)$s));
}

$nombre      = clean($data['nombre']      ?? '');
$institucion = clean($data['institucion'] ?? '');
$correo      = clean($data['correo']      ?? '');
$asunto      = clean($data['asunto']      ?? '');
$mensaje     = clean($data['mensaje']     ?? '');

// ---- Validar ----
if ($nombre === '' || $correo === '' || $asunto === '' || $mensaje === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Faltan campos obligatorios']);
    exit;
}
if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Correo no válido']);
    exit;
}

// ---- Construir cuerpo del correo (HTML) ----
$asunto_mail = '[Observatorio] ' . $asunto;
$correo_safe      = htmlspecialchars($correo,      ENT_QUOTES, 'UTF-8');
$nombre_safe      = htmlspecialchars($nombre,      ENT_QUOTES, 'UTF-8');
$institucion_safe = htmlspecialchars($institucion, ENT_QUOTES, 'UTF-8');
$asunto_safe      = htmlspecialchars($asunto,      ENT_QUOTES, 'UTF-8');
$mensaje_safe     = nl2br(htmlspecialchars($mensaje, ENT_QUOTES, 'UTF-8'));

$cuerpo  = "<!DOCTYPE html><html><body style='font-family:Arial,sans-serif;color:#1A1A1A;background:#FBF8F3;padding:24px;'>";
$cuerpo .= "<div style='max-width:620px;margin:0 auto;background:#fff;border:1px solid #E5E0D5;padding:32px;'>";
$cuerpo .= "<h2 style='font-family:Georgia,serif;color:#5B2D91;margin:0 0 6px;'>Nuevo mensaje — Observatorio</h2>";
$cuerpo .= "<p style='color:#8A8A8A;font-size:12px;letter-spacing:.1em;text-transform:uppercase;margin:0 0 24px;'>Formulario de contacto institucional</p>";
$cuerpo .= "<table style='width:100%;border-collapse:collapse;font-size:14px;'>";
$cuerpo .= "<tr><td style='padding:10px 0;border-bottom:1px solid #EFEAE0;width:130px;color:#8A8A8A;'>Nombre</td><td style='padding:10px 0;border-bottom:1px solid #EFEAE0;'>{$nombre_safe}</td></tr>";
$cuerpo .= "<tr><td style='padding:10px 0;border-bottom:1px solid #EFEAE0;color:#8A8A8A;'>Institución</td><td style='padding:10px 0;border-bottom:1px solid #EFEAE0;'>" . ($institucion_safe ?: '—') . "</td></tr>";
$cuerpo .= "<tr><td style='padding:10px 0;border-bottom:1px solid #EFEAE0;color:#8A8A8A;'>Correo</td><td style='padding:10px 0;border-bottom:1px solid #EFEAE0;'><a href='mailto:{$correo_safe}' style='color:#5B2D91;'>{$correo_safe}</a></td></tr>";
$cuerpo .= "<tr><td style='padding:10px 0;border-bottom:1px solid #EFEAE0;color:#8A8A8A;'>Asunto</td><td style='padding:10px 0;border-bottom:1px solid #EFEAE0;'>{$asunto_safe}</td></tr>";
$cuerpo .= "</table>";
$cuerpo .= "<div style='margin-top:24px;'>";
$cuerpo .= "<p style='color:#8A8A8A;font-size:12px;letter-spacing:.1em;text-transform:uppercase;margin:0 0 8px;'>Mensaje</p>";
$cuerpo .= "<div style='padding:18px;background:#FBF8F3;border-left:3px solid #C8943C;font-size:14px;line-height:1.6;'>{$mensaje_safe}</div>";
$cuerpo .= "</div>";
$cuerpo .= "<p style='margin-top:28px;font-size:11px;color:#8A8A8A;'>Mensaje enviado desde el formulario del sitio web del Observatorio sobre Derecho de Género y Seguridad Jurídica.</p>";
$cuerpo .= "</div></body></html>";

// ---- Headers ----
$headers  = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";
$headers .= "From: {$remitente_nombre} <{$remitente_email}>\r\n";
$headers .= "Reply-To: {$nombre} <{$correo}>\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

// ---- Enviar a cada destinatario ----
$ok_total = true;
foreach ($destinatarios as $to) {
    $ok = @mail($to, $asunto_mail, $cuerpo, $headers);
    if (!$ok) $ok_total = false;
}

if ($ok_total) {
    echo json_encode([
        'ok' => true,
        'mensaje' => 'Gracias por contactar al Observatorio sobre Derecho de Género y Seguridad Jurídica. Tu mensaje ha sido recibido correctamente.'
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'No se pudo enviar el correo desde el servidor. Por favor escribe directamente a los correos institucionales.'
    ]);
}

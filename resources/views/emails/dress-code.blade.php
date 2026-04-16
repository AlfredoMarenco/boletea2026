<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{{ $eventName ?? 'Código de Vestimenta' }}</title>
  <style>
    /* Reset */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; }

    body {
      margin: 0;
      padding: 0;
      background-color: #0a1628;
      font-family: 'Georgia', serif;
    }

    .wrapper {
      width: 100%;
      background-color: #0a1628;
      padding: 40px 0;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #0f1e35;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #c9a84c;
    }

    /* Header */
    .header {
      background: linear-gradient(135deg, #0a1628 0%, #1a2f52 50%, #0a1628 100%);
      padding: 40px 24px 32px;
      text-align: center;
      border-bottom: 2px solid #c9a84c;
    }
    .header-logo {
      margin-bottom: 16px;
    }
    .header-logo img {
      height: 48px;
      width: auto;
    }
    .header-title {
      font-size: 28px;
      color: #c9a84c;
      letter-spacing: 4px;
      text-transform: uppercase;
      margin: 0 0 8px 0;
      font-weight: 400;
    }
    .header-subtitle {
      font-size: 13px;
      color: #8fa3c0;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin: 0;
    }

    /* Golden divider */
    .gold-divider {
      width: 60px;
      height: 2px;
      background: linear-gradient(90deg, transparent, #c9a84c, transparent);
      margin: 16px auto;
    }

    /* Body */
    .body {
      padding: 40px 40px 32px;
    }
    .greeting {
      font-size: 15px;
      color: #c9a84c;
      margin: 0 0 20px 0;
      font-style: italic;
    }
    .body-text {
      font-size: 15px;
      line-height: 1.8;
      color: #cdd8e8;
      margin: 0 0 20px 0;
    }
    .event-name {
      color: #c9a84c;
      font-style: italic;
    }
    .dress-code-badge {
      display: inline-block;
      background: linear-gradient(135deg, #c9a84c, #e8c96d, #c9a84c);
      color: #0a1628;
      font-size: 18px;
      font-weight: bold;
      letter-spacing: 3px;
      text-transform: uppercase;
      padding: 12px 32px;
      border-radius: 4px;
      margin: 16px 0;
    }
    .body-note {
      font-size: 14px;
      color: #8fa3c0;
      line-height: 1.7;
      margin: 0 0 24px 0;
    }

    /* Image */
    .img-container {
      border: 1px solid #c9a84c;
      border-radius: 6px;
      overflow: hidden;
      margin: 24px 0;
    }
    .img-container img {
      max-width: 100%;
      display: block;
    }
    .img-caption {
      background-color: #0a1628;
      text-align: center;
      padding: 10px;
      font-size: 12px;
      color: #8fa3c0;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    /* Gracias */
    .thanks-block {
      background: linear-gradient(135deg, #1a2f52, #0f1e35);
      border: 1px solid #c9a84c33;
      border-radius: 6px;
      padding: 20px 24px;
      margin: 24px 0;
      text-align: center;
    }
    .thanks-text {
      font-size: 18px;
      color: #c9a84c;
      margin: 0 0 6px 0;
    }
    .thanks-sub {
      font-size: 13px;
      color: #8fa3c0;
      margin: 0;
    }

    /* Closing */
    .closing {
      font-size: 15px;
      color: #cdd8e8;
      margin: 24px 0 0 0;
    }

    /* Footer */
    .footer {
      background-color: #060e1c;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #c9a84c44;
    }
    .footer p {
      font-size: 11px;
      color: #4a5a70;
      line-height: 1.6;
      margin: 0;
    }
    .footer a {
      color: #c9a84c;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">

      <!-- HEADER -->
      <div class="header">
        <div class="header-title">{{ $eventName ?? 'Gala con Causa' }}</div>
        <div class="gold-divider"></div>
        <div class="header-subtitle">Código de Vestimenta</div>
      </div>

      <!-- BODY -->
      <div class="body">

        <p class="greeting">Estimado/a {{ $recipientName }},</p>

        <p class="body-text">
          {!! nl2br(e($message)) !!}
        </p>

        <div style="text-align:center;">
          <div class="dress-code-badge">Black Tie</div>
        </div>

        @if($imagePath && file_exists(storage_path('app/public/' . $imagePath)))
        <div class="img-container">
          <img src="{{ asset('storage/' . $imagePath) }}"
               alt="Código de vestimenta – {{ $eventName }}" />
          <div class="img-caption">Referencia ilustrativa · Código de vestimenta</div>
        </div>
        @endif

        <div class="thanks-block">
          <p class="thanks-text">¡Gracias por donar!</p>
          <p class="thanks-sub">Tu aporte hace la diferencia.</p>
        </div>

        <p class="closing">
          Saludos cordiales,<br />
          <strong style="color:#c9a84c;">Equipo {{ config('app.name') }}</strong>
        </p>
      </div>

      <!-- FOOTER -->
      <div class="footer">
        <p>
          Este correo fue enviado a <a href="mailto:{{ $recipientEmail ?? '' }}">{{ $recipientEmail ?? '' }}</a>
          en relación al evento <strong>{{ $eventName }}</strong>.<br />
          Si tienes alguna duda, contáctanos.
        </p>
      </div>

    </div>
  </div>
</body>
</html>

export default  {
     VerificationEmail : `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Confirmation</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        .header {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        .otp {
            font-size: 32px;
            font-weight: bold;
            color: #007bff;
            margin: 20px 0;
        }
        .message {
            font-size: 16px;
            color: #666;
        }
        .footer {
            font-size: 14px;
            color: #999;
            margin-top: 20px;
        }
        .footer a {
            color: #007bff;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <p class="header">OTP Confirmation</p>
        <p class="message">Your One-Time Password (OTP) for verification is:</p>
        <p class="otp">{{otp}}</p>
        <p class="message">Please enter this OTP to complete your verification. This OTP will expire in 10 minutes.</p>
        <p class="footer">If you did not request this OTP, please ignore this email or contact support.<br>
        Need help? <a href="{{SUPPORT_LINK}}">Contact Support</a></p>
    </div>
</body>
</html>
`,

welcomeEmail : `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to [Your App Name]!</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        .logo {
            max-width: 150px;
            margin-bottom: 20px;
        }
        .header {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        .message {
            font-size: 16px;
            color: #666;
            margin: 20px 0;
        }
        .cta-button {
            display: inline-block;
            padding: 12px 20px;
            font-size: 16px;
            font-weight: bold;
            color: #ffffff;
            background-color: #007bff;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
        }
        .footer {
            font-size: 14px;
            color: #999;
            margin-top: 20px;
        }
        .footer a {
            color: #007bff;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <img src="{{LOGO_URL}}" alt="Logo" class="logo">
        <p class="header">Welcome to {{APP_NAME}}!</p>
        <p class="message">Hi {{NAME}},</p>
        <p class="message">We're thrilled to have you on board! Start exploring all the amazing features we have to offer.</p>
        <a href="{{DASHBOARD_LINK}}" class="cta-button">Go to Dashboard</a>
        <p class="footer">Need help? <a href="{{SUPPORT_LINK}}">Contact Support</a></p>
    </div>
</body>
</html>
`,

ResetPassword : `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Confirmation</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        .header {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        .otp {
            font-size: 32px;
            font-weight: bold;
            color: #007bff;
            margin: 20px 0;
        }
        .message {
            font-size: 16px;
            color: #666;
        }
        .footer {
            font-size: 14px;
            color: #999;
            margin-top: 20px;
        }
        .footer a {
            color: #007bff;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <p class="header">Pasword Reset</p>
        <p class="message">Your One-Time Password (OTP) for verification is:</p>
        <p class="otp">{{otp}}</p>
        <p class="message">Please enter this OTP to complete your verification. This OTP will expire in 10 minutes.</p>
        <p class="footer">If you did not request this OTP, please ignore this email or contact support.<br>
        Need help? <a href="{{SUPPORT_LINK}}">Contact Support</a></p>
    </div>
</body>
</html>`,

emailChange : `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Email Change Verification</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #f4f4f7;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    .header h1 {
      color: #333;
      font-size: 22px;
    }
    .message {
      font-size: 16px;
      color: #555;
      line-height: 1.6;
    }
    .button {
      display: inline-block;
      margin-top: 25px;
      padding: 12px 24px;
      background-color: #4f46e5;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
    }
    .footer {
      margin-top: 30px;
      font-size: 13px;
      text-align: center;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Confirm Your New Email</h1>
    </div>
    <div class="message">
      <p>Hi there,</p>
      <p>We received a request to change your email address. To confirm this change, please click the button below:</p>

      <a href="{{verificationLink}}" class="button">Verify New Email</a>

      <p>If you didn’t request this change, you can safely ignore this email.</p>
      <p>Thanks,<br>The Team</p>
    </div>
    <div class="footer">
      © {{year}} YourCompany. All rights reserved.
    </div>
  </div>
</body>
</html>
`
}
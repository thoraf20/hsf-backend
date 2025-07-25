export default {
  VerificationEmail: `<!DOCTYPE html>
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
  disable2faEmail: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
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

  welcomeEmail: `<!DOCTYPE html>
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

  ResetPassword: `<!DOCTYPE html>
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

  emailChange: `<!DOCTYPE html>
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
`,
  InspectionForVideoCallEmail: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Property Inspection Confirmation</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background: #f8f8f8;
        padding: 20px;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 8px;
        padding: 30px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      }
      h2 {
        color: #0a5ebf;
      }
      p {
        line-height: 1.6;
      }
      .footer {
        margin-top: 30px;
        font-size: 13px;
        color: #777;
        text-align: center;
      }
      .button {
        background-color: #0a5ebf;
        color: white;
        padding: 12px 20px;
        text-decoration: none;
        border-radius: 5px;
        display: inline-block;
        margin-top: 15px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Inspection Request Sent ✅</h2>
      <p>Hi {{full_name}},</p>
      <p>Thank you for scheduling an inspection for one of our properties.</p>

      <p><strong>Inspection Details:</strong></p>
      <ul>
        <li><strong>Date:</strong> {{inspection_date}}</li>
        <li><strong>Time:</strong> {{inspection_time}}</li>
        <li><strong>Meeting Type:</strong> {{inspection_meeting_type}}</li>
        <li><strong>Platform:</strong> {{meeting_platform}}</li>
        <li><strong>Meeting Link:</strong> <a href="{{meet_link}}">{{meet_link}}</a></li>
      </ul>

      <p>Our team looks forward to assisting you with your property viewing and answering any questions you may have.</p>

      <a class="button" href="{{meet_link}}" target="_blank">Join Meeting</a>

      <div class="footer">
        <p>If you have any questions, feel free to reply to this email.</p>
        <p>© {{year}} Your Company Name</p>
      </div>
    </div>
  </body>
</html>
`,
  InspectionForInpersonCallEmail: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Property Inspection Confirmation</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background: #f8f8f8;
        padding: 20px;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 8px;
        padding: 30px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      }
      h2 {
        color: #0a5ebf;
      }
      p {
        line-height: 1.6;
      }
      .footer {
        margin-top: 30px;
        font-size: 13px;
        color: #777;
        text-align: center;
      }
      .button {
        background-color: #0a5ebf;
        color: white;
        padding: 12px 20px;
        text-decoration: none;
        border-radius: 5px;
        display: inline-block;
        margin-top: 15px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Inspection Request Sent ✅</h2>
      <p>Hi {{full_name}},</p>
      <p>Thank you for scheduling an inspection for one of our properties.</p>

      <p><strong>Inspection Details:</strong></p>
      <ul>
        <li><strong>Date:</strong> {{inspection_date}}</li>
        <li><strong>Time:</strong> {{inspection_time}}</li>
        <li><strong>Meeting Type:</strong> {{inspection_meeting_type}}</li>
      </ul>

      <p>Our team looks forward to assisting you with your property viewing and answering any questions you may have.</p>

      <div class="footer">
        <p>If you have any questions, feel free to reply to this email.</p>
        <p>© {{year}} Your Company Name</p>
      </div>
    </div>
  </body>
</html>
`,

  prequalifierVerificationCode: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Email Verification</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f4;
      padding: 20px;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: auto;
      background: #ffffff;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .otp {
      font-size: 24px;
      font-weight: bold;
      color: #0052cc;
      margin: 20px 0;
      text-align: center;
      letter-spacing: 5px;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #888;
      text-align: center;
    }
    .btn {
      display: inline-block;
      background-color: #0052cc;
      color: #fff;
      padding: 10px 20px;
      border-radius: 6px;
      text-decoration: none;
      margin-top: 20px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Verify Your Email</h2>
    <p>Hello {{full_name}},</p>
    <p>Thank you for beginning your prequalification process. Please use the OTP below to verify your email:</p>
    <div class="otp">{{otp}}</div>
    <p>This code will expire in 10 minutes.</p>
    <p>If you didn’t request this, please ignore this message. {{Date}}</p>
    <div class="footer">© {{year}} YourCompany. All rights reserved .</div>
  </div>
</body>
</html>

`,
  SuccessfulPrequalifier: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Prequalification Complete</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f0f2f5;
      padding: 20px;
      color: #333;
    }
    .container {
      max-width: 600px;
      background-color: #fff;
      margin: 0 auto;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    h2 {
      color: #28a745;
    }
    .btn {
      display: inline-block;
      margin-top: 20px;
      padding: 10px 20px;
      background-color: #28a745;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
    }
    .footer {
      margin-top: 40px;
      font-size: 12px;
      color: #aaa;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>🎉 Prequalification Complete!</h2>
    <p>Hi {{name}},</p>
    <p>Congratulations! Your prequalification request has been successfully submitted and verified. {{Date}}</p>
    <p>Your reference number is: <strong>{{reference_id}}</strong></p>
    <p>We’ll be in touch with the next steps shortly. You can also log into your account to check the status.</p>
    <div class="footer">© {{year}} YourCompany. All rights reserved.</div>
  </div>
</body>
</html>

`,
  sharePropertyTemplate: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Shared Property</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f6f6f6;
      margin: 0;
      padding: 0;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background: #ffffff;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.08);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }
    .property-image {
      width: 100%;
      height: auto;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    .property-details {
      padding: 15px 0;
    }
    .property-details h2 {
      margin: 0;
      font-size: 22px;
      color: #2c3e50;
    }
    .property-details p {
      margin: 5px 0;
      font-size: 14px;
    }
    .message-box {
      background: #f1f1f1;
      padding: 15px;
      border-radius: 5px;
      margin-top: 20px;
      font-style: italic;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      margin-top: 30px;
      color: #888;
    }
  .property-images img {
  width: 100%;
  height: auto;
  border-radius: 6px;
  margin-bottom: 15px;
}

    .btn {
      display: inline-block;
      background: #007BFF;
      color: #fff;
      padding: 10px 18px;
      text-decoration: none;
      border-radius: 4px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏠 A Property Has Been Shared With You</h1>
      <p>From: <strong>{{sender_email}}</strong></p>
    </div>

    <div class="property-images">
  {{property_images}}
</div>


    <div class="property-details">
      <h2>{{property_name}}</h2>
      <p><strong>Address:</strong> {{street_address}}, {{city}}, {{state}}, {{postal_code}}</p>
      <p><strong>Price:</strong>{{property_price}}</p>
      <p><strong>Type:</strong> {{property_type}}</p>
      <p><strong>Size:</strong> {{property_size}}</p>
      <p><strong>Bedrooms:</strong> {{numbers_of_bedroom}} | <strong>Bathrooms:</strong> {{numbers_of_bathroom}}</p>
    </div>

    <div class="message-box">
      <strong>Message from {{sender_email}}:</strong>
      <p>{{message}}</p>
    </div>


    <div style="text-align: center;">
      <a href="{{property_link}}" class="btn">View Property</a>
    </div>

    <div class="footer">
      <p>You're receiving this email because someone shared a property with you.</p>
    </div>
  </div>
</body>
</html>
`,

  InvitationEmail: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Admin Invitation</title>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background-color: #f9f9f9;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      background-color: #fff;
      margin: 50px auto;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      padding: 30px;
      color: #333;
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
    }
    .header h2 {
      color: #2c3e50;
    }
    .message {
      margin-bottom: 25px;
      line-height: 1.6;
    }
    .button {
      display: block;
      width: fit-content;
      margin: 20px auto;
      padding: 12px 24px;
      background-color: #3498db;
      color: #fff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #999;
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>You're Invited to Join as {{role}}</h2>
    </div>
    <div class="message">
      <p>Hello, {{fullname}}</p>
      <p>You have been invited to join our platform as {{role}}. Please activate your account by clicking the button below. Your default password is:</p>
      <p><strong>{{defaultPassword}}</strong></p>
      <p>For security, you will be prompted to change your password on first login.</p>
    </div>
    <a href="{{activationLink}}" class="button">Accept Invite</a>
    <div class="footer">
      &copy; {{year}} HsfDirect. All rights reserved.
    </div>
  </div>
</body>
</html>
`,

  mfaVerification: `<!DOCTYPE html>
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

  inspectionReschedule: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reschedule Inspection</title>
    <style>
        /* Reset styles for email compatibility */
        body, html {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            line-height: 1.6;
        }
        /* Container styles */
        .container {
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            border: 1px solid #ccc;
            border-radius: 8px;
            background-color: #f9f9f9;
        }
        /* Heading styles */
        h1 {
            color: #333;
            text-align: center;
        }
        /* Content styles */
        .content {
            margin-top: 20px;
            color: #666;
        }
        /* Button styles */
        .btn {
            display: inline-block;
            padding: 10px 20px;
            text-decoration: none;
            background-color: #007bff;
            color: #fff;
            border-radius: 5px;
        }
        /* Responsive styles */
        @media only screen and (max-width: 500px) {
            .container {
                width: 100%;
                padding: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Reschedule Inspection</h1>
        <div class="content">
            <p>Dear {{name}} </p>
            <p>We regret to inform you that we need to reschedule the upcoming inspection appointment. We apologize for any inconvenience caused.</p>
            <p>Please here is the propose time on {{day}},  the inspection will start by {{start_time}}, and end by {{end_time}}</p>
            <p>Please go to your dashboard to confirm your</p>
            <p>If you have any questions or need further assistance, please don't hesitate to contact us.</p>
            <p>Thank you for your understanding.</p>
            <p>Best regards,</p>
            <p>{{company_name}}</p>
        </div>
    </div>
</body>
</html>
`,

  inspectionRescheduleConfirmation: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Inspection Response</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f2f4f6;
    }
    .email-container {
      max-width: 600px;
      margin: 30px auto;
      background-color: #ffffff;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    h2 {
      color: #333333;
    }
    p {
      color: #555555;
      line-height: 1.6;
    }
    .btn {
      display: inline-block;
      padding: 10px 20px;
      margin-top: 20px;
      background-color: #28a745;
      color: #ffffff;
      text-decoration: none;
      border-radius: 5px;
    }
    .btn.cancel {
      background-color: #dc3545;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #999999;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <h2>Inspection Appointment Update</h2>
    <p>Dear {{organization_name}},</p>

     ✅ For Confirmation

    <p>{{client_name}} has confirm your inspection appointment scheduled for <strong>{{date_time}}</strong>.</p>
    <p>Our team looks forward to seeing you at the location: <strong>{{address}}</strong>.</p>

    <p>If you have any questions or need assistance, feel free to contact us.</p>
    <p>Thank you,<br>
    {{client_name}}</p>

    <div class="footer">
      © {{year}} {{organization_name}}. All rights reserved.
    </div>
  </div>
</body>
</html>
`,

  inspectionRescheduleCancellation: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Inspection Response</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f2f4f6;
    }
    .email-container {
      max-width: 600px;
      margin: 30px auto;
      background-color: #ffffff;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    h2 {
      color: #333333;
    }
    p {
      color: #555555;
      line-height: 1.6;
    }
    .btn {
      display: inline-block;
      padding: 10px 20px;
      margin-top: 20px;
      background-color: #28a745;
      color: #ffffff;
      text-decoration: none;
      border-radius: 5px;
    }
    .btn.cancel {
      background-color: #dc3545;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #999999;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <h2>Inspection Appointment Update</h2>
    ❌ For Cancellation
    <p>Dear {{organization_name}},</p>
    <p>{{client_name}} has ❌ canceled  your inspection appointment originally scheduled for <strong>{{date_time}}</strong>.</p>
    <p>If you'd like to reschedule, you can do so using the link below at your convenience.</p>

    <p>If you have any questions or need assistance, feel free to contact us.</p>
    <p>Thank you,<br>
    {{client_name}}</p>
    <div class="footer">
      © {{Year}} {{organization_name}}. All rights reserved.
    </div>
  </div>
</body>
</html>
`,
  resetPasswordForOrganization: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Password Reset</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: auto;
      background-color: #ffffff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #0052cc;
      color: #ffffff;
      padding: 20px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .content {
      padding: 20px;
      color: #333333;
    }
    .password-box {
      background-color: #f1f1f1;
      padding: 12px;
      font-size: 16px;
      font-weight: bold;
      margin: 15px 0;
      text-align: center;
      border-radius: 5px;
      word-break: break-word;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      margin-top: 20px;
      background-color: #0052cc;
      color: #ffffff;
      text-decoration: none;
      border-radius: 5px;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #777777;
      text-align: center;
    }
    @media (max-width: 600px) {
      .email-container {
        padding: 15px;
      }
      .button {
        display: block;
        width: 100%;
        text-align: center;
      }
    }
  </style>
</head>
<body>

  <div class="email-container">
    <div class="header">
      <h2>Password Reset Notification</h2>
    </div>
    <div class="content">
      <p>Hello, {{full_name}}</p>
      <p>We’ve reset your password as requested. Please use the temporary password below to log in:</p>

      <div class="password-box">{{default_password}}</div>

      <p>After logging in, we strongly recommend that you change your password for security purposes.</p>

      <a href={{url}} class="button">Log In</a>

      <p>If you didn’t request this change, please contact our support team immediately.</p>

      <p>Best regards,<br>The IT Support Team</p>
    </div>
    <div class="footer">
      © 2025 {{your_organization}}. All rights reserved.<br>
      123 Business Rd, Suite 100, City, Country
    </div>
  </div>

</body>
</html>

`,
  disable2faEmailByOrg: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>2FA Disabled</title>
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
  }
</style>
</head>
<body>
<div class="container">
  <h1>2FA Disabled</h1>
  <p>Dear {{full_name}},</p>
  <p>2-Factor Authentication has been disabled for your account in {{organization_name}}.</p>
  <p>If you did not request this change, please contact support immediately.</p>
  <p>Sincerely,<br>The HSF Team</p>
  <p>{{year}}</p>
</div>
</body>
</html>
`,

  recoveryCodeNotification: `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Recovery Code Used</title>
  </head>
  <body>
    <p>Dear {{userName}},</p>
    <p>This is to notify you that one of your recovery codes was recently used to access your account.</p>
    <p>If you initiated this action, you can disregard this email.</p>
    <p>However, if you did not use a recovery code to access your account, we strongly recommend that you reset your recovery codes immediately to prevent unauthorized access.</p>
    <p>You can reset your recovery codes in your account settings.</p>
    <p>Sincerely,</p>
    <p>The ${process.env.PLATFORM_NAME} Team</p>
  </body>
  </html>
`,
  organizationSuspended: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Organization Suspended</title>
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
    }
    .header {
      font-size: 24px;
      font-weight: bold;
      color: #333;
      text-align: center;
      margin-bottom: 20px;
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
  </style>
</head>
<body>
  <div class="container">
    <p class="header">Organization Suspended</p>
    <p class="message">Dear {{organizationName}},</p>
    <p class="message">Your organization has been suspended. Please contact support for more information.</p>
    <p class="footer">The HSF Team</p>
  </div>
</body>
</html>
`,
  organizationDeleted: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Organization Deleted</title>
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
    }
     .header {
      font-size: 24px;
      font-weight: bold;
      color: #333;
      text-align: center;
      margin-bottom: 20px;
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
  </style>
</head>
<body>
  <div class="container">
    <p class="header">Organization Deleted</p>
    <p class="message">Dear {{organizationName}},</p>
    <p class="message">Your organization has been deleted. Please contact support for more information.</p>
    <p class="footer">The HSF Team</p>
  </div>
</body>
</html>
`,

  organizationActivated: `<!DOCTYPE html>
 <html>
 <head>
   <meta charset="UTF-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <title>Organization Activated</title>
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
     }
     .header {
       font-size: 24px;
       font-weight: bold;
       color: #333;
       text-align: center;
       margin-bottom: 20px;
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
   </style>
 </head>
 <body>
   <div class="container">
     <p class="header">Organization Activated</p>
     <p class="message">Dear {{organizationName}},</p>
     <p class="message">Your organization has been activated.</p>
     <p class="footer">The HSF Team</p>
   </div>
 </body>
 </html>
 `,
  loanRepaymentOverdue: `<!DOCTYPE html>
 <html>
 <head>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <title>Loan Payment Overdue</title>
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
         }
         .header {
             font-size: 24px;
             font-weight: bold;
             color: #d9534f;
             text-align: center;
             margin-bottom: 20px;
         }
         .urgent-banner {
             background-color: #f2dede;
             border: 1px solid #ebccd1;
             color: #a94442;
             padding: 15px;
             border-radius: 5px;
             margin-bottom: 20px;
             text-align: center;
             font-weight: bold;
         }
         .loan-details {
             background-color: #f8f9fa;
             padding: 15px;
             border-radius: 5px;
             margin: 20px 0;
         }
         .loan-details h3 {
             margin-top: 0;
             color: #333;
         }
         .loan-details p {
             margin: 5px 0;
             color: #666;
         }
         .amount-due {
             font-size: 24px;
             font-weight: bold;
             color: #d9534f;
             text-align: center;
             margin: 20px 0;
         }
         .message {
             font-size: 16px;
             color: #666;
             line-height: 1.6;
         }
         .action-button {
             display: inline-block;
             padding: 12px 24px;
             background-color: #d9534f;
             color: #ffffff;
             text-decoration: none;
             border-radius: 5px;
             font-weight: bold;
             margin: 20px auto;
             text-align: center;
         }
         .payment-methods {
             background-color: #e8f4fd;
             padding: 15px;
             border-radius: 5px;
             margin: 20px 0;
         }
         .footer {
             font-size: 14px;
             color: #999;
             margin-top: 20px;
             text-align: center;
         }
         .footer a {
             color: #007bff;
             text-decoration: none;
         }
         .warning-text {
             color: #d9534f;
             font-weight: bold;
         }
     </style>
 </head>
 <body>
     <div class="container">
         <p class="header">⚠️ Payment Overdue Notice</p>

         <div class="urgent-banner">
             URGENT: Your loan payment is now overdue
         </div>

         <p class="message">Dear {{borrower_name}},</p>

         <p class="message">This is an important notice regarding your loan payment that was due on <strong>{{due_date}}</strong>. Your payment is now <span class="warning-text">{{days_overdue}} days overdue</span>.</p>

         <div class="loan-details">
             <h3>Loan Details:</h3>
             <p><strong>Loan ID:</strong> {{loan_id}}</p>
             <p><strong>Property Address:</strong> {{property_address}}</p>
             <p><strong>Original Due Date:</strong> {{due_date}}</p>
             <p><strong>Days Overdue:</strong> {{days_overdue}} days</p>
         </div>

         <div class="amount-due">
             Amount Due: {{currency}}{{overdue_amount}}
         </div>

         <p class="message">To avoid additional late fees and potential impact to your credit score, please make your payment immediately.</p>
         <p class="footer">
             Questions? Contact us at {{support_email}} or {{support_phone}}<br>
             <a href="{{SUPPORT_LINK}}">Customer Support Portal</a><br><br>
             This is an automated notice. Please retain this email for your records.<br>
             © {{year}} {{company_name}}. All rights reserved.
         </p>
     </div>
 </body>
 </html>
 `,

 DocumentCompleteReview: `
 <!-- hsf-review-completed.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>HSF Document Review Complete</title>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background-color: #eef2f7;
      padding: 20px;
      color: #444;
    }
    .card {
      background: #ffffff;
      max-width: 600px;
      margin: auto;
      padding: 25px;
      border-radius: 10px;
      box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.07);
    }
    h2 {
      color: #28a745;
      font-size: 20px;
    }
    p {
      font-size: 15px;
      line-height: 1.5;
    }
    .cta-button {
      background-color: #28a745;
      color: white;
      padding: 10px 16px;
      border-radius: 5px;
      text-decoration: none;
      display: inline-block;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h2>HSF Document Review Completed</h2>
    <p>Hello {{name}},</p>
    <p>We’ve completed the HSF review for your application ID: <strong>{{applicationId}}</strong>.</p>
    <p>Please check your dashboard to proceed with the next stage.</p>
    <a href="{{link}}" class="cta-button">Go to Dashboard</a>
    <p style="margin-top: 25px;">Regards,<br>{{org}} Team © {{year}} </p>
  </div>
</body>
</html>
 `,

 FailedDocumentApproval : `<!-- document-not-approved.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Document Not Approved</title>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background-color: #f9f9f9;
      padding: 20px;
      color: #444;
    }
    .email-container {
      background-color: #fff;
      max-width: 600px;
      margin: auto;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    }
    h1 {
      color: #dc3545;
      font-size: 22px;
    }
    p {
      font-size: 15px;
      line-height: 1.6;
    }
    .button {
      display: inline-block;
      margin-top: 20px;
      padding: 10px 16px;
      background-color: #dc3545;
      color: #fff;
      border-radius: 5px;
      text-decoration: none;
    }
    .footer {
      margin-top: 30px;
      font-size: 13px;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <h1>Document Not Approved</h1>
    <p>Hello {{name}},</p>
    <p>We regret to inform you that your document for <strong>{{propertyName}}</strong> was <strong>not approved</strong>.</p>
    <p>Reason: <em>{{reason}}</em></p>
    <p>Please review the document and submit a revised version for approval.</p>
    <a href="{{uploadLink}}" class="button">Resubmit Document</a>
    <div class="footer">
      <p>If you have questions, please contact support.</p>
      <p>Thanks,<br>{{org}} Team © {{year}}</p>
    </div>
  </div>
</body>
</html>
`,
 DocumentApproval: `
 <!-- document-approval-notification.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Document Approval Notification</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f5f7fa;
      padding: 20px;
      color: #333;
    }
    .container {
      background: #fff;
      padding: 30px;
      border-radius: 8px;
      max-width: 600px;
      margin: auto;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    h1 {
      font-size: 20px;
      color: #1a73e8;
    }
    p {
      font-size: 16px;
      line-height: 1.6;
    }
    .button {
      display: inline-block;
      background: #1a73e8;
      color: #fff;
      padding: 12px 18px;
      margin-top: 20px;
      border-radius: 5px;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Document Approval Update</h1>
    <p>Dear {{name}},</p>
    <p>Your document for property <strong>{{propertyName}}</strong> has been reviewed.</p>
    <p>Status: <strong>{{approvalStatus}}</strong></p>
    <a href="{{link}}" class="button">View Document</a>
    <p style="margin-top: 30px;">Thanks,<br>{{org}} Team © {{year}} </p>
  </div>
</body>
</html>
 `,

 EscrowMeeting: `<!-- escrow-meeting-invite.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Escrow Meeting Scheduled</title>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background-color: #f4f4f4;
      padding: 20px;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: auto;
      background-color: #ffffff;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    }
    h2 {
      color: #007bff;
    }
    p {
      font-size: 15px;
      line-height: 1.6;
    }
    .details {
      background-color: #f9f9f9;
      padding: 15px;
      border-radius: 6px;
      margin-top: 20px;
      border: 1px solid #ddd;
    }
    .details p {
      margin: 5px 0;
    }
    .footer {
      margin-top: 30px;
      font-size: 13px;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Escrow Meeting Scheduled</h2>
    <p>Hello {{name}},</p>
    <p>You have been scheduled for an escrow meeting regarding the property <strong>{{propertyName}}</strong>.</p>
    <div class="details">
      <p><strong>Date:</strong> {{date}}</p>
      <p><strong>Time:</strong> {{time}}</p>
      <p><strong>Location:</strong> {{location}}</p>
      <p><strong>Agent:</strong> {{agentName}}</p>
      <p><strong>Agent Phone:</strong> {{agentPhone}}</p>
      <p><strong>Meeting Details:</strong> {{meetingDetails}}</p>
    </div>
    <p>If you have any questions or need to reschedule, please contact your agent.</p>
    <div class="footer">
      <p>Thank you,<br/>The Escrow Coordination Team</p>
    </div>
  </div>
</body>
</html>
`
}



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
      <h2>Inspection Confirmed ✅</h2>
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
      <h2>Inspection Confirmed ✅</h2>
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

prequalifierVerificationCode : `
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
sharePropertyTemplate : `<!DOCTYPE html>
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
      <h2>You're Invited to Join as an Admin</h2>
    </div>
    <div class="message">
      <p>Hello, {{fullname}}</p>
      <p>You have been invited to join our platform as an {{role}}. Please activate your account by clicking the button below. Your default password is:</p>
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
`
}

import os
from sib_api_v3_sdk import ApiClient, Configuration
from sib_api_v3_sdk.api.transactional_emails_api import TransactionalEmailsApi
from sib_api_v3_sdk.models import SendSmtpEmail
from twilio.rest import Client as TwilioClient

# Brevo (Sendinblue) email OTP sender
BREVO_API_KEY = os.getenv('BREVO_API_KEY', '')
BREVO_SENDER_EMAIL = os.getenv('BREVO_SENDER_EMAIL', 'noreply@apex-learning.com')

def send_email_otp(recipient_email, otp_code):
    """
    Send OTP via email using Brevo (Sendinblue).
    Returns True if sent successfully, False otherwise.
    """
    if not BREVO_API_KEY:
        print('[OTP] BREVO_API_KEY not configured - email OTP disabled')
        print(f'[OTP] Would send OTP {otp_code} to {recipient_email}')
        return False

    subject = 'Your Apex Learning Platform OTP'
    html_content = f'''
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00D4FF;">Apex Learning Platform</h2>
        <p>Your One-Time Password (OTP) for verification is:</p>
        <div style="background: #1a1a2e; color: #00D4FF; font-size: 32px; font-weight: bold;
                    padding: 20px; text-align: center; border-radius: 8px; letter-spacing: 8px;">
            {otp_code}
        </div>
        <p style="color: #666; margin-top: 20px;">
            This code will expire in 10 minutes. Do not share this code with anyone.
        </p>
        <p style="color: #999; font-size: 12px;">
            If you didn't request this code, please ignore this email.
        </p>
    </div>
    '''

    configuration = Configuration()
    configuration.api_key['api-key'] = BREVO_API_KEY
    api_instance = TransactionalEmailsApi(ApiClient(configuration))

    send_smtp_email = SendSmtpEmail(
        to=[{"email": recipient_email}],
        sender={"email": BREVO_SENDER_EMAIL, "name": "Apex Learning"},
        subject=subject,
        html_content=html_content
    )

    try:
        api_instance.send_transac_email(send_smtp_email)
        print(f'[OTP] Email sent successfully to {recipient_email}')
        return True
    except Exception as e:
        print(f'[OTP] Email send failed: {e}')
        return False


# Twilio SMS OTP sender
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', '')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER', '')

def send_sms_otp(recipient_phone, otp_code):
    """
    Send OTP via SMS using Twilio.
    Returns True if sent successfully, False otherwise.
    
    NOTE: Twilio trial accounts can only send SMS to verified phone numbers.
    Verify numbers at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
    """
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN or not TWILIO_PHONE_NUMBER:
        print('[OTP] Twilio credentials not configured - SMS OTP disabled')
        print(f'[OTP] Would send OTP {otp_code} to {recipient_phone}')
        return False

    # Ensure phone number has country code
    phone = recipient_phone.strip()
    if not phone.startswith('+'):
        phone = '+' + phone

    message = f'Your Apex Learning Platform OTP is: {otp_code}. Valid for 10 minutes.'

    try:
        client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        msg = client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=phone
        )
        print(f'[OTP] SMS sent successfully to {phone} (SID: {msg.sid})')
        return True
    except Exception as e:
        error_msg = str(e)
        print(f'[OTP] SMS send failed to {phone}: {error_msg}')
        if 'unverified' in error_msg.lower() or '21608' in error_msg:
            print(f'[OTP] HINT: Phone number {phone} is not verified in Twilio.')
            print(f'[OTP] Verify it at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified')
        elif '21211' in error_msg:
            print(f'[OTP] HINT: Phone number {phone} is not a valid phone number.')
        elif '20003' in error_msg:
            print(f'[OTP] HINT: Twilio authentication failed. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.')
        return False

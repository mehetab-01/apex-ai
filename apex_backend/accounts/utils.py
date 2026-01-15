
import os
from sib_api_v3_sdk import ApiClient, Configuration
from sib_api_v3_sdk.api.transactional_emails_api import TransactionalEmailsApi
from sib_api_v3_sdk.models import SendSmtpEmail
from twilio.rest import Client as TwilioClient

# Brevo (Sendinblue) email OTP sender
BREVO_API_KEY = os.getenv('BREVO_API_KEY', '')
BREVO_SENDER_EMAIL = os.getenv('BREVO_SENDER_EMAIL', '')

def send_email_otp(recipient_email, otp_code):
    subject = 'Your Apex Learning Platform OTP'
    message = f'Your OTP code is: {otp_code}'
    configuration = Configuration()
    configuration.api_key['api-key'] = BREVO_API_KEY
    api_instance = TransactionalEmailsApi(ApiClient(configuration))
    send_smtp_email = SendSmtpEmail(
        to=[{"email": recipient_email}],
        sender={"email": BREVO_SENDER_EMAIL},
        subject=subject,
        text_content=message
    )
    try:
        api_instance.send_transac_email(send_smtp_email)
        return True
    except Exception as e:
        print(f'Email OTP send failed: {e}')
        return False

# Twilio SMS OTP sender
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', '')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER', '')

def send_sms_otp(recipient_phone, otp_code):
    client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    message = f'Your Apex Learning Platform OTP is: {otp_code}'
    try:
        client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=recipient_phone
        )
        return True
    except Exception as e:
        print(f'SMS OTP send failed: {e}')
        return False

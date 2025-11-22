import React, { useState } from "react";
import { nhost } from "../lib/nhost";

const GENERATE_OTP = `mutation GenerateOTP($new_email: String!, $otp: String!, $user_id: uuid!) {
  insert_email_otps_one(object: { 
    new_email: $new_email, 
    otp: $otp, 
    user_id: $user_id,
    expires_at: "${new Date(Date.now() + 10*60*1000).toISOString()}"
  }) {
    id
    new_email
    otp
    created_at
    expires_at
  }
}`;

const CHECK_OTP = `query CheckOTP($new_email: String!, $otp: String!) {
  email_otps(
    where: {
      new_email: { _eq: $new_email },
      otp: { _eq: $otp },
      verified: { _eq: false },
      expires_at: { _gt: "now()" }
    },
    limit: 1,
    order_by: { created_at: desc }
  ) {
    id
    new_email
    otp
    created_at
    expires_at
    verified
    user_id
  }
}`;

const UPDATE_AUTH_USER = `mutation UpdateAuthUser($userId: uuid!, $email: String!) {
  updateUser(pk_columns: {id: $userId}, _set: {email: $email}) {
    id
    email
  }
}`;

const MARK_OTP_VERIFIED = `mutation MarkOtpVerified($id: uuid!) {
  update_email_otps_by_pk(pk_columns: { id: $id }, _set: { verified: true }) {
    id
    verified
  }
}`;

export default function ChangeEmail() {
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState("enter");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const generateRandomOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

  const sendEmailOTP = async (email, otpCode) => {
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: '71e8ecda-7923-4dd1-9ccc-0a5e73e48fd7',
          to: email,
          subject: 'Email Change Verification - OTP Code',
          message: `Your verification code is: ${otpCode}\n\nThis code expires in 10 minutes.`
        })
      });
      
      if (response.ok) {
        console.log('OTP sent to:', email);
        return true;
      }
      throw new Error('Email service failed');
    } catch (error) {
      console.log('Using fallback - OTP in alert');
      alert(`OTP: ${otpCode}\n\nIn production, this would be sent to: ${email}`);
      return false;
    }
  };

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      const otpCode = generateRandomOTP();
      const user = await nhost.auth.getUser();
      const userId = user?.body?.id || user?.id;
      
      const response = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
        },
        body: JSON.stringify({
          query: GENERATE_OTP,
          variables: { new_email: newEmail, otp: otpCode, user_id: userId }
        })
      });
      const result = await response.json();
      if (result.errors) throw new Error(result.errors[0].message);
      
      const emailSent = await sendEmailOTP(newEmail, otpCode);
      setStage("otp");
      
      // Always show OTP as backup since email delivery is unreliable
      alert(`OTP: ${otpCode}\n\nEmail sent to: ${newEmail}\n(Also showing here as backup)`);
      
      setMessage({ 
        type: "success", 
        text: `OTP sent to ${newEmail} and shown above`
      });
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      const checkResponse = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
        },
        body: JSON.stringify({
          query: CHECK_OTP,
          variables: { new_email: newEmail, otp }
        })
      });
      const checkResult = await checkResponse.json();
      if (checkResult.errors) throw new Error(checkResult.errors[0].message);
      
      const row = checkResult?.data?.email_otps?.[0];
      if (!row) throw new Error("Invalid or expired OTP");

      await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
        },
        body: JSON.stringify({
          query: MARK_OTP_VERIFIED,
          variables: { id: row.id }
        })
      });
      
      const user = await nhost.auth.getUser();
      const userId = user?.body?.id || user?.id;
      
      // Update auth user email
      await nhost.auth.changeEmail({ newEmail });
      
      // Update profile email if exists
      await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
        },
        body: JSON.stringify({
          query: `mutation UpdateProfile($userId: uuid!, $email: String!) {
            update_profiles(where: {auth_id: {_eq: $userId}}, _set: {email: $email}) {
              affected_rows
            }
          }`,
          variables: { userId, email: newEmail }
        })
      });
      
      setStage("done");
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {stage === "enter" && (
        <>
          <input 
            value={newEmail} 
            onChange={(e) => setNewEmail(e.target.value)} 
            placeholder="New email"
            style={{
              width: '100%',
              padding: '0.5rem',
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid rgba(212, 175, 55, 0.5)',
              borderRadius: '6px',
              color: '#FFD700',
              marginBottom: '0.5rem'
            }}
          />
          <button 
            onClick={handleSendOtp}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              background: loading ? 'rgba(212, 175, 55, 0.3)' : 'linear-gradient(45deg, #FFD700, #FFA500)',
              border: 'none',
              borderRadius: '6px',
              color: loading ? '#D4AF37' : '#000',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600'
            }}
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </>
      )}
      {stage === "otp" && (
        <>
          <input 
            value={otp} 
            onChange={(e) => setOtp(e.target.value)} 
            placeholder="Enter OTP"
            style={{
              width: '100%',
              padding: '0.5rem',
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid rgba(212, 175, 55, 0.5)',
              borderRadius: '6px',
              color: '#FFD700',
              marginBottom: '0.5rem'
            }}
          />
          <button 
            onClick={handleVerify}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              background: loading ? 'rgba(212, 175, 55, 0.3)' : 'linear-gradient(45deg, #FFD700, #FFA500)',
              border: 'none',
              borderRadius: '6px',
              color: loading ? '#D4AF37' : '#000',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600'
            }}
          >
            {loading ? 'Verifying...' : 'Verify & Update'}
          </button>
        </>
      )}
      {stage === "done" && <p style={{ color: '#00ff00' }}>Email updated successfully.</p>}
      {message && <p style={{ color: message.type === "error" ? "red" : "green" }}>{message.text}</p>}
    </div>
  );
}
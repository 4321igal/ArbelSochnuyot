import { defineAuth } from '@aws-amplify/backend';

/**
 * Amplify Auth Configuration
 * 
 * Features:
 * - Email-based sign up with verification
 * - User groups: Admin, Customer
 * - Strong password policy
 * - Optional MFA
 */
export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: 'CODE',
      verificationEmailSubject: 'Welcome to Our Store - Verify Your Email',
      verificationEmailBody: (code) => `
        <h1>Welcome!</h1>
        <p>Your verification code is: <strong>${code()}</strong></p>
        <p>This code expires in 24 hours.</p>
      `,
    },
  },
  
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
    givenName: {
      required: false,
      mutable: true,
    },
    familyName: {
      required: false,
      mutable: true,
    },
    phoneNumber: {
      required: false,
      mutable: true,
    },
  },

  // User groups for authorization
  groups: ['Admin', 'Customer'],

  // Password policy
  passwordPolicy: {
    minLength: 8,
    requireLowercase: true,
    requireUppercase: true,
    requireNumbers: true,
    requireSymbols: true,
  },

  // Multi-factor authentication
  multifactor: {
    mode: 'OPTIONAL',
    totp: true,
    sms: false, // SMS has additional costs
  },

  // Account recovery
  accountRecovery: 'EMAIL_ONLY',
});

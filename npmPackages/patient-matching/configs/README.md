# Patient Matching Configuration Guide

## Quick Start

To use patient matching with mock identity verification (for development):

```bash
meteor run --settings packages/patient-matching/configs/settings.patient-matching.json
```

## Configuration Overview

### Identity Providers

The package supports multiple identity verification providers:

1. **Mock Provider** (Default for Development)
   - Simulates identity verification without external services
   - Configurable test accounts with different IAL levels
   - Instant verification for testing

2. **ID.me** (Recommended for Healthcare)
   - NIST 800-63-3 compliant
   - Supports IAL1, IAL2, and IAL3
   - Used by VA, CMS, and many health systems
   - Get credentials at: https://developers.id.me

3. **Login.gov** (For Government Healthcare)
   - Federal government identity provider
   - NIST 800-63-3 compliant
   - Supports IAL1 and IAL2
   - Register at: https://developers.login.gov

4. **CLEAR** (Premium Healthcare Identity)
   - Biometric verification
   - Real-time identity proofing
   - Healthcare-specific workflows
   - Contact CLEAR Health for access

5. **Verato** (Patient Matching Specialist)
   - Referential matching algorithm
   - Cross-organization patient matching
   - EMPI capabilities
   - Contact Verato for API access

### Setting Up Identity Providers

#### ID.me Setup

1. Register at https://developers.id.me
2. Create a new application
3. Add these redirect URIs:
   - `http://localhost:3000/identity-callback` (development)
   - `https://your-app.com/identity-callback` (production)
4. Copy credentials to settings:

```json
{
  "private": {
    "identityProviders": {
      "idme": {
        "enabled": true,
        "clientId": "YOUR_CLIENT_ID",
        "clientSecret": "YOUR_SECRET",
        "apiKey": "YOUR_API_KEY"
      }
    }
  }
}
```

#### Login.gov Setup

1. Register at https://developers.login.gov
2. Generate RSA key pair:
   ```bash
   openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048
   openssl rsa -pubout -in private_key.pem -out public_key.pem
   ```
3. Upload public key to Login.gov dashboard
4. Update settings with private key path

### Identity Assurance Levels (IAL)

- **IAL1**: Self-asserted identity (email/phone verification)
- **IAL2**: Remote identity proofing (government ID + address verification)
- **IAL3**: In-person identity proofing with biometric verification

### Patient Matching Configuration

#### Matching Thresholds
- **Certain**: ≥ 95% match confidence
- **Probable**: ≥ 80% match confidence  
- **Possible**: ≥ 60% match confidence

#### Attribute Weights
Adjust these based on your data quality:
- **Identifier** (35%): SSN, MRN, driver's license
- **Name** (25%): Family and given names
- **Birth Date** (20%): Date of birth
- **Gender** (5%): Administrative gender
- **Address** (10%): Street, city, state, ZIP
- **Telecom** (5%): Phone, email

### Security Considerations

1. **Production Settings**
   - Set `mockIdentityProvider: false`
   - Enable `encryptPatientData: true`
   - Configure proper `allowedOrigins`
   - Use environment variables for secrets

2. **Audit Logging**
   - All identity verification attempts are logged
   - Patient match operations are tracked
   - Configurable retention period

3. **Data Protection**
   - SSNs are masked in logs
   - Biometric data is not stored (only match results)
   - Sessions expire after 30 minutes

### Environment Variables

Set these in production instead of storing in settings.json:

```bash
export PATIENT_MATCHING_API_KEY="your-api-key"
export IDME_CLIENT_SECRET="your-secret"
export LOGIN_GOV_PRIVATE_KEY="$(cat private_key.pem)"
```

### Testing Identity Verification

With mock provider enabled, use these test flows:

1. **Test IAL1**: Basic identity verification
2. **Test IAL2**: Includes document upload simulation
3. **Test IAL3**: Includes biometric verification simulation

### Troubleshooting

1. **"No match service URL configured"**
   - This is normal for local development
   - External matching service is optional

2. **"Identity provider not enabled"**
   - Check `enabled: true` for your provider
   - Verify credentials are set

3. **"Session expired"**
   - Identity verification sessions expire after 30 minutes
   - User must restart the verification process

### Support

- ID.me Support: https://help.id.me/hc/en-us
- Login.gov Support: https://developers.login.gov/support/
- CLEAR Health: Contact your account manager
- Verato: https://verato.com/support/
import { get } from 'lodash';

/**
 * SmartOnFhir class for handling SMART on FHIR authentication and data fetching
 */
class SmartOnFhir {
  constructor(config) {
    this.config = {
      fhirServiceUrl: '',
      redirect_uri: '',
      client_id: '',
      client_secret: '',
      ...config
    };

    this.state = {
      capabilityStatement: null,
      smartConfig: null,
      accessToken: null,
      patient: null,
      selectedPatientId: null,
      resources: new Map()
    };

    this.onStateChange = null;
  }

  /**
   * Set state and trigger state change callback if defined
   * @param {Object} newState - Partial state to update
   */
  setState(newState) {
    this.state = {
      ...this.state,
      ...newState
    };
    
    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }

  /**
   * Register callback for state changes
   * @param {Function} callback 
   */
  setStateChangeCallback(callback) {
    this.onStateChange = callback;
  }

  /**
   * Fetch FHIR server capability statement
   */
  async fetchCapabilityStatement() {
    try {
      const response = await fetch(
        `${this.config.fhirServiceUrl}/metadata?_format=json`
      );
      const data = await response.json();
      this.setState({ capabilityStatement: data });
      return this;
    } catch (error) {
      console.error('Error fetching capability statement:', error);
      throw error;
    }
  }

  /**
   * Fetch SMART configuration from well-known endpoint 
   */
  async fetchWellKnownSmartConfig() {
    try {
      const response = await fetch(
        `${this.config.fhirServiceUrl}/.well-known/smart-configuration`
      );
      const data = await response.json();
      this.setState({ smartConfig: data });
      return this;
    } catch (error) {
      console.error('Error fetching SMART config:', error);
      throw error;
    }
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code
   */
  async exchangeCodeForAccessToken(code) {
    try {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.config.redirect_uri,
        client_id: this.config.client_id
      });

      const response = await fetch(this.state.smartConfig.token_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const data = await response.json();
      this.setState({ accessToken: data.access_token });
      
      if (data.patient) {
        await this.fetchPatient(data.patient);
      }
      
      return this;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  }

  /**
   * Fetch patient resource
   * @param {string} patientId 
   */
  async fetchPatient(patientId) {
    try {
      const response = await fetch(
        `${this.config.fhirServiceUrl}/Patient/${patientId}?_format=json`,
        {
          headers: {
            'Authorization': `Bearer ${this.state.accessToken}`
          }
        }
      );
      
      const data = await response.json();
      this.setState({ 
        patient: data,
        selectedPatientId: data.id 
      });
      
      return this;
    } catch (error) {
      console.error('Error fetching patient:', error);
      throw error;
    }
  }

  /**
   * Fetch resources for a specific patient
   * @param {string} resourceType - FHIR resource type
   * @param {Object} queryParams - Additional query parameters
   */
  async fetchPatientResources(resourceType, queryParams = {}) {
    try {
      const params = new URLSearchParams({
        patient: this.state.selectedPatientId,
        ...queryParams
      });

      const response = await fetch(
        `${this.config.fhirServiceUrl}/${resourceType}?${params.toString()}`,
        {
          headers: {
            'Accept': 'application/json,application/fhir+json',
            'Authorization': `Bearer ${this.state.accessToken}`
          }
        }
      );

      const bundle = await response.json();
      
      if (bundle.resourceType === 'Bundle') {
        const resources = bundle.entry?.map(entry => entry.resource) || [];
        this.state.resources.set(resourceType, resources);
        this.setState({ resources: this.state.resources });
      }

      return this;
    } catch (error) {
      console.error(`Error fetching ${resourceType}:`, error);
      throw error;
    }
  }

  /**
   * Get cached resources by type
   * @param {string} resourceType 
   * @returns {Array} Array of resources
   */
  getResources(resourceType) {
    return this.state.resources.get(resourceType) || [];
  }
}

export default SmartOnFhir;
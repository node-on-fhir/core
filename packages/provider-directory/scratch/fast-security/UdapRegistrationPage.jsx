import React, { useState } from 'react';

import { useFormik, FormikErrors } from 'formik';

import { 
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardHeader,
  CardContent,
  CardMedia,
  Container,
  Grid,  
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Image,
  Typography
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { get } from 'lodash';
import { PageCanvas, StyledCard } from 'fhir-starter';

import { Icon } from 'react-icons-kit';
import { github } from 'react-icons-kit/fa/github';

import { useTracker } from 'meteor/react-meteor-data';

import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

import jwt from 'jsonwebtoken';

import forge from 'node-forge';

import base64 from 'base-64';


let pki = forge.pki;

// import { LayoutHelpers } from 'clinical:hl7-fhir-data-infrastructure';

const useStyles = makeStyles(theme => ({
  root: {
    maxWidth: 345,
  },
  media: {
    minHeight: 400,
  },
  open_stack: {
    minHeight: 1200,
    backgroundSize: 'contain'
  },
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  textField: {},
  button: {}
}));

function DynamicSpacer(props){
  return(<div style={{height: props.height}}></div>)
}



function UdapRegistrationPage(props){
  const classes = useStyles();

  let [ certificate, setCertificate ] = useState([]);
  let [ udapConfig, setUdapConfig ] = useState("");
  let [ publicKey, setPublicKey ] = useState("");
  let [ privateKey, setPrivateKey ] = useState("");

  let [ publicKeyPem, setPublicKeyPem ] = useState("");
  let [ privateKeyPem, setPrivateKeyPem ] = useState("");

  let [ wellKnownUdapUrl, setWellKnownUdapUrl ] = useState(Meteor.absoluteUrl() + ".well-known/udap");
  let [ registrationEndpoint, setRegistrationEndpoint ] = useState(Meteor.absoluteUrl() + "oauth/registration")
  

  let [ token, setToken ] = useState("");
  let [ decodedJwt, setDecodedJwt ] = useState("");

  const formik = useFormik({
    initialValues: {
      iss: 'http://example.com/my-b2b-app',
      sub: 'http://example.com/my-b2b-app',
      aud: 'https://oauth.example.net/register',
      exp: '1597186041',
      iat: '1597186041',
      jti: 'random-value-109a3bd72',
      client_name: 'Acme B2B App',
      redirect_uris: '',
      contacts: "mailto:b2b-operations@example.com",
      logo_uri: '',
      grant_types: "client_credentials",
      response_types: "",
      token_endpoint_auth_method: "private_key_jwt",
      scope: 'system/Patient.read system/Procedure.read'
    },
    validate: function(values){
      const errors = {};
      
      if (!values.iss) {
        errors.iss = 'Required';
      }
      if (!values.sub) {
        errors.sub = 'Required';
      }
      if (!values.aud) {
        errors.aud = 'Required';
      }
      if (!values.exp) {
        errors.exp = 'Required';
      }
      if (!values.iat) {
        errors.iat = 'Required';
      }
      if (!values.jti) {
        errors.jti = 'Required';
      }
      if (!values.client_name) {
        errors.client_name = 'Required';
      }
      if (!values.contacts) {
        errors.contacts = 'Required';
      }
      if (!values.grant_types) {
        errors.grant_types = 'Required';
      }
      if (!values.token_endpoint_auth_method) {
        errors.token_endpoint_auth_method = 'Required';
      }
      if (!values.scope) {
        errors.scope = 'Required';
      }
      return errors;
    },
    onSubmit: async function(values, { setSubmitting }){

      console.log('Trying to register UDAP client...')
      // console.log('values', values);

      let jwtPayload = {
        iss: get(values, 'iss'),
        sub: get(values, 'sub'),
        aud: get(values, 'aud'),
        exp: parseInt(get(values, 'exp')),
        iat: parseInt(get(values, 'iat')),
        jti: get(values, 'jti'),
        client_name: get(values, 'client_name'),
        redirect_uris: get(values, 'redirect_uris'),
        contacts: [get(values, 'contacts')],
        logo_uri: get(values, 'logo_uri'),
        grant_types: [get(values, 'grant_types')],
        response_types: get(values, 'response_types'),
        token_endpoint_auth_method: get(values, 'token_endpoint_auth_method'),
        scope: get(values, 'scope')
      }

      let jwtHeader = {
        "alg": "RS256",
        "x5c": []
      };

      console.log('jwtHeader', jwtHeader)
      console.log('jwtPayload', jwtPayload);

      let postUrl = Meteor.absoluteUrl() + 'generateAndSignJwt';
      HTTP.post(postUrl, {
        headers: {},
        data: jwtPayload
      }, function(error, signResult){
        if(error){
          console.error('error', error);
        }
        if(signResult){
          console.log('signResult', signResult);

          // if we have a certificate from the server, we can begin constructing the JWT header
          // note:  may want to move this server side
          if(get(signResult, 'data.token')){
            setToken(get(signResult, 'data.token'));
          }            
        }
      })

      // Meteor.call('generateAndSignJwt', jwtPayload, function(error, signResult){
      //   if(error){
      //     console.error('error', error);
      //   }
      //   if(signResult){
      //     console.log('signResult', signResult);

      //     // if we have a certificate from the server, we can begin constructing the JWT header
      //     // note:  may want to move this server side
      //     if(get(signResult, 'token')){
      //       setToken(get(signResult, 'token'));
      //     }            
      //   }
      // })
    }
  });


  //----------------------------------------------------------------------
  // Carousel  

  const responsive = {
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 3,
      paritialVisibilityGutter: 60
    },
    tablet: {
      breakpoint: { max: 1024, min: 464 },
      items: 2,
      paritialVisibilityGutter: 50
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 1,
      paritialVisibilityGutter: 30
    }
  };


  function openExternalPage(url){
    logger.debug('client.app.layout.UdapRegistrationPage.openExternalPage', url);
    window.open(url);
    // props.history.replace(url)
  }

  //----------------------------------------------------------------------
  // Page Styling 


  let pageStyle = {
    paddingLeft: '0px', 
    paddingRight: '0px',
    position: 'absolute',
    top: '0px'
  }

  //----------------------------------------------------------------------
  // Main Render Method  

  

  let tagLineStyle = {
    fontWeight: 'normal',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: '0px',
    marginBottom: '40px'
  }

  let featureRowStyle = {
    height: '52px'
  }

  function openPage(url){
    props.history.replace(url)
  }

  function handelUpdateWellKnownUdapUrl(event){
    setWellKnownUdapUrl(event.currentTarget.value)
  }
  function handelUpdateSendRegistrationUrl(event){
    setRegistrationEndpoint(event.currentTarget.value)
  }
  function handleFetchWellknownUdap(){
    console.log('wellKnownUdapUrl', wellKnownUdapUrl);

    // HTTP.get(wellKnownUdapUrl, function(error, result){
    //   if(error){
    //     console.log('handleFetchWellknownUdap.error', error)
    //   }
    //   if(result){
    //     console.log('handleFetchWellknownUdap.result.data', get(result, 'data'))

    //     setUdapConfig(get(result, 'data'));
        
    //     if(Array.isArray(get(result, 'data.x5c'))){
    //       console.log('x.509 cert: ' + result.data.x5c[0]);
    //       setCertificate(result.data.x5c);          
    //     }
    //   }
    // })

    Meteor.call('fetchWellKnownUdap', wellKnownUdapUrl, function(error, result){
      if(error){
        console.log('handleFetchWellknownUdap.error', error)
      }
      if(result){
        console.log('handleFetchWellknownUdap.result.data', get(result, 'data'))

        setUdapConfig(get(result, 'data'));
        
        if(Array.isArray(get(result, 'data.x5c'))){
          console.log('x.509 cert: ' + result.data.x5c[0]);
          setCertificate(result.data.x5c);          
        }
        
      }

    })
  }
  function generateKeys(){
    let keys = pki.rsa.generateKeyPair(2048);
    console.log('keys', keys)

    var publicKeyPem = pki.publicKeyToPem(keys.publicKey);
    console.log('publicKeyPem', JSON.stringify(publicKeyPem))

    setPublicKeyPem(JSON.stringify(publicKeyPem))

    var privateKeyPem = pki.privateKeyToPem(keys.privateKey);
    console.log('privateKeyPem', JSON.stringify(privateKeyPem))

    setPrivateKeyPem(JSON.stringify(privateKeyPem))

  }
  function decodeToken(){
    console.log("decodeToken");

    let decoded = jwt.decode(token);
    console.log('decoded', decoded);

    setDecodedJwt(decoded);
  }
  function verifyToken(){
    console.log("verifyToken");


  }
  function handleClickSend(){
    console.log("Sending JWT token...", token);
    let postUrl = get(Meteor, 'settings.public.interfaces.oauthServer.channel.endpoint', "http://localhost:3000/") + "oauth/registration";
    console.log('postUrl', postUrl);

    let payload = {
      "udap" : "1",
      "software_statement" : token,
      "certifications" : [certificate]
    }

    console.log('payload', payload)

    Meteor.call('sendSoftwareStatement', {
      url: registrationEndpoint,
      data: payload
    }, function(error, result){
      if(error){
        console.log('/oauth/registration error', error)
        alert('Error!  Message: ' + get(error, 'message'))
      }
      if(result){
        console.log('/oauth/registration', result)
        if(get(result, 'statusCode') === 201){
          alert('Created!  Client id: ' + get(result, 'data.client_id'))
        }
      }
    })
  }

  

  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor();
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();

  return (
    <PageCanvas id='UdapRegistrationPage' headerHeight={headerHeight} paddingLeft={10} paddingRight={10}>

      <Container maxWidth="xl" style={{paddingBottom: '80px'}}>
        <Grid container spacing={3} justify="center" style={{marginBottom: '20px'}}>
          <Grid item xs={4} sm={4}>
            <StyledCard margin={20} style={{width: '100%'}}  >
              <CardHeader title="Fetch UDAP Info of New App"/>
              <CardContent>
                <TextField
                  label=".well-known/udap Location"
                  fullWidth={true}
                  id="wellknownUdap"
                  type="wellknownUdap"
                  value={wellKnownUdapUrl}
                  onChange={handelUpdateWellKnownUdapUrl.bind(this)}
                  error={Boolean(formik.errors.iss && formik.touched.iss)}
                  helperText={formik.touched.iss && formik.errors.iss}
                  style={{marginBottom: '10px'}}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleFetchWellknownUdap.bind(this)}
                >Fetch</Button>
              </CardContent>
            </StyledCard>

            <StyledCard margin={20} style={{width: '100%'}}  >
              <CardHeader title="Public Certificate"/>
              <CardContent>
                <TextField
                  fullWidth={true}
                  id="x509Certificate"
                  type="x509Certificate"
                  value={certificate}
                  style={{marginBottom: '10px'}}
                  multiline
                  InputProps={{
                    style: {
                      fontSize: '100%',
                      fontFamily: 'monospace'
                    }
                  }}
                />
              </CardContent>
            </StyledCard>

            <StyledCard margin={20} style={{width: '100%'}}  >
              <CardContent>
                <code>
                  {JSON.stringify(udapConfig, null, 2)}
                </code>
              </CardContent>
            </StyledCard>
          </Grid>
          <Grid item xs={4} sm={4}>
            
            <StyledCard margin={20} style={{width: '100%'}}  >
              <form onSubmit={formik.handleSubmit} style={{width: '100%'}}>
                <CardHeader title="Create Registration Token"/>
                <CardContent>
                  
                  <TextField
                    label="iss"
                    // variant="outlined"
                    fullWidth={true}
                    id="iss"
                    type="iss"
                    value={formik.values.iss}
                    onChange={formik.handleChange}
                    error={Boolean(formik.errors.iss && formik.touched.iss)}
                    helperText={formik.touched.iss && formik.errors.iss}
                    style={{marginBottom: '10px'}}
                  />

                  <TextField
                    label="sub"
                    // variant="outlined"
                    fullWidth={true}
                    id="sub"
                    type="sub"
                    value={formik.values.sub}
                    onChange={formik.handleChange}
                    error={Boolean(formik.errors.sub && formik.touched.sub)}
                    helperText={formik.touched.sub && formik.errors.sub}
                    style={{marginBottom: '10px'}}
                  />

                  <TextField
                    label="aud"
                    // variant="outlined"
                    fullWidth={true}
                    id="aud"
                    type="aud"
                    value={formik.values.aud}
                    onChange={formik.handleChange}
                    error={Boolean(formik.errors.aud && formik.touched.aud)}
                    helperText={formik.touched.aud && formik.errors.aud}
                    style={{marginBottom: '10px'}}
                  />

                  <TextField
                    label="exp"
                    // variant="outlined"
                    fullWidth={true}
                    id="exp"
                    type="exp"
                    value={formik.values.exp}
                    onChange={formik.handleChange}
                    error={Boolean(formik.errors.exp && formik.touched.exp)}
                    helperText={formik.touched.exp && formik.errors.exp}
                    style={{marginBottom: '10px'}}
                  />

                  <TextField
                    label="iat"
                    // variant="outlined"
                    fullWidth={true}
                    id="iat"
                    type="iat"
                    value={formik.values.iat}
                    onChange={formik.handleChange}
                    error={Boolean(formik.errors.iat && formik.touched.iat)}
                    helperText={formik.touched.iat && formik.errors.iat}
                    style={{marginBottom: '10px'}}
                  />

                  <TextField
                    label="jti"
                    // variant="outlined"
                    fullWidth={true}
                    id="jti"
                    type="jti"
                    value={formik.values.jti}
                    onChange={formik.handleChange}
                    error={Boolean(formik.errors.jti && formik.touched.jti)}
                    helperText={formik.touched.jti && formik.errors.jti}
                    style={{marginBottom: '10px'}}
                  />

                  <TextField
                    label="client_name"
                    // variant="outlined"
                    fullWidth={true}
                    id="client_name"
                    type="client_name"
                    value={formik.values.client_name}
                    onChange={formik.handleChange}
                    error={Boolean(formik.errors.client_name && formik.touched.client_name)}
                    helperText={formik.touched.client_name && formik.errors.client_name}
                    style={{marginBottom: '10px'}}
                  />

                  <TextField
                    label="redirect_uris"
                    // variant="outlined"
                    fullWidth={true}
                    id="redirect_uris"
                    type="redirect_uris"
                    value={formik.values.redirect_uris}
                    onChange={formik.handleChange}
                    error={Boolean(formik.errors.redirect_uris && formik.touched.redirect_uris)}
                    helperText={formik.touched.redirect_uris && formik.errors.redirect_uris}
                    style={{marginBottom: '10px'}}
                  />

                  <TextField
                    label="contacts"
                    // variant="outlined"
                    fullWidth={true}
                    id="contacts"
                    type="contacts"
                    value={formik.values.contacts}
                    onChange={formik.handleChange}
                    error={Boolean(formik.errors.contacts && formik.touched.contacts)}
                    helperText={formik.touched.contacts && formik.errors.contacts}
                    style={{marginBottom: '10px'}}
                  />

                  <TextField
                    label="logo_uri"
                    // variant="outlined"
                    fullWidth={true}
                    id="logo_uri"
                    type="logo_uri"
                    value={formik.values.logo_uri}
                    onChange={formik.handleChange}
                    error={Boolean(formik.errors.logo_uri && formik.touched.logo_uri)}
                    helperText={formik.touched.logo_uri && formik.errors.logo_uri}
                    style={{marginBottom: '10px'}}
                  />

                  <TextField
                    label="grant_types"
                    // variant="outlined"
                    fullWidth={true}
                    id="grant_types"
                    type="grant_types"
                    value={formik.values.grant_types}
                    onChange={formik.handleChange}
                    error={Boolean(formik.errors.grant_types && formik.touched.grant_types)}
                    helperText={formik.touched.grant_types && formik.errors.grant_types}
                    style={{marginBottom: '10px'}}
                  />

                  <TextField
                    label="response_types"
                    // variant="outlined"
                    fullWidth={true}
                    id="response_types"
                    type="response_types"
                    value={formik.values.response_types}
                    onChange={formik.handleChange}
                    error={Boolean(formik.errors.response_types && formik.touched.response_types)}
                    helperText={formik.touched.response_types && formik.errors.response_types}
                    style={{marginBottom: '10px'}}
                  />

                  <TextField
                    label="token_endpoint_auth_method"
                    // variant="outlined"
                    fullWidth={true}
                    id="token_endpoint_auth_method"
                    type="token_endpoint_auth_method"
                    value={formik.values.token_endpoint_auth_method}
                    onChange={formik.handleChange}
                    error={Boolean(formik.errors.token_endpoint_auth_method && formik.touched.token_endpoint_auth_method)}
                    helperText={formik.touched.token_endpoint_auth_method && formik.errors.token_endpoint_auth_method}
                    style={{marginBottom: '10px'}}
                  />

                  <TextField
                    label="scope"
                    // variant="outlined"
                    fullWidth={true}
                    id="scope"
                    type="scope"
                    value={formik.values.scope}
                    onChange={formik.handleChange}
                    error={Boolean(formik.errors.scope && formik.touched.scope)}
                    helperText={formik.touched.scope && formik.errors.scope}
                    style={{marginBottom: '10px'}}
                  />

                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    disabled={formik.isSubmitting}
                  >Sign Software Statement</Button>

                </CardContent>
              </form>
            </StyledCard>
          </Grid>
          <Grid item xs={4} sm={4}>
            <StyledCard margin={20} style={{width: '100%'}}  >
              <CardHeader title="Registration Statement (JWT)"/>
              <CardContent>
                <TextField
                  fullWidth={true}
                  id="jwtToken"
                  type="jwtToken"
                  value={token}
                  style={{marginBottom: '10px'}}
                  multiline
                  InputProps={{
                    style: {
                      fontSize: '100%',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-line'
                    }
                  }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={decodeToken.bind(this)}
                  style={{marginRight: '10px'}}
                >Decode</Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={verifyToken.bind(this)}
                >Verify</Button>
              </CardContent>
            </StyledCard>
            <StyledCard margin={20} style={{width: '100%'}}  >
              <CardContent>
                <code>
                  {JSON.stringify(decodedJwt, null, 2)}
                </code>
              </CardContent>
            </StyledCard>
            <StyledCard margin={20} style={{width: '100%'}}  >
              <CardContent>
                <TextField
                  label="Send Software Registration"
                  fullWidth={true}
                  id="sendRegistration"
                  type="sendRegistration"
                  value={registrationEndpoint}
                  onChange={handelUpdateSendRegistrationUrl.bind(this)}
                  error={Boolean(formik.errors.iss && formik.touched.iss)}
                  helperText={formik.touched.iss && formik.errors.iss}
                  style={{marginBottom: '10px'}}
                />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleClickSend.bind(this)}
                  >Send</Button>
              </CardContent>
            </StyledCard>
           </Grid>
        </Grid>
      </Container>

    </PageCanvas>
  );
}

export default UdapRegistrationPage;
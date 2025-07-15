// /imports/patient/AutoDashboard.jsx

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { useLocation, useParams, useHistory, useNavigate } from "react-router-dom";

import React, {useEffect, useContext, useState} from "react";
import { FhirClientContext } from "../FhirClientContext";

import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Container,
    Divider,
    Fade,
    Grid,
    Paper,
    Skeleton,
    Typography,
    Chip,
    Avatar,
    IconButton,
    Collapse,
    useTheme,
    alpha,
    Stack
} from '@mui/material';

import {
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    LocalHospital as LocalHospitalIcon,
    MedicalServices as MedicalServicesIcon,
    Vaccines as VaccinesIcon,
    MonitorHeart as MonitorHeartIcon,
    Assignment as AssignmentIcon,
    Group as GroupIcon,
    Place as PlaceIcon,
    EventNote as EventNoteIcon,
    VerifiedUser as VerifiedUserIcon,
    Description as DescriptionIcon,
    Flag as FlagIcon,
    Medication as MedicationIcon,
    AttachFile as AttachFileIcon,
    Warning as WarningIcon,
    MedicalInformation as MedicalInformationIcon,
    Chat as ChatIcon,
    Article as ArticleIcon
} from '@mui/icons-material';

import { useTracker } from 'meteor/react-meteor-data';

import ImmunizationsTable from '../ui-tables/ImmunizationsTable';
import CarePlansTable from '../ui-tables/CarePlansTable';
import CareTeamsTable from '../ui-tables/CareTeamsTable';
import LocationsTable from '../ui-tables/LocationsTable';
import EncountersTable from '../ui-tables/EncountersTable';
import ProceduresTable from '../ui-tables/ProceduresTable';
import ConditionsTable from '../ui-tables/ConditionsTable';
import ObservationsTable from '../ui-tables/ObservationsTable';
import ConsentsTable from '../ui-tables/ConsentsTable';
import QuestionnairesTable from '../ui-tables/QuestionnairesTable';
import QuestionnaireResponsesTable from '../ui-tables/QuestionnaireResponsesTable';
import GoalsTable from '../ui-tables/GoalsTable';
import MedicationAdministrationsTable from '../ui-fhir/medicationAdministrations/MedicationAdministrationsTable';
import MedicationRequestsTable from '../ui-fhir/medicationRequests/MedicationRequestsTable';
import DocumentReferencesTable from '../ui-fhir/documentReferences/DocumentReferencesTable';
import AllergyIntolerancesTable from '../ui-fhir/allergyIntolerances/AllergyIntolerancesTable';
import ServiceRequestsTable from '../ui-fhir/serviceRequests/ServiceRequestsTable';
import CommunicationsTable from '../ui-fhir/communications/CommunicationsTable';
import CompositionsTable from '../ui-fhir/compositions/CompositionsTable';

import { CarePlans } from '../lib/schemas/SimpleSchemas/CarePlans';
import { CareTeams } from '../lib/schemas/SimpleSchemas/CareTeams';
import { Consents } from '../lib/schemas/SimpleSchemas/Consents';
import { Conditions } from '../lib/schemas/SimpleSchemas/Conditions';
import { Encounters } from '../lib/schemas/SimpleSchemas/Encounters';
import { Immunizations } from '../lib/schemas/SimpleSchemas/Immunizations';
import { Locations } from '../lib/schemas/SimpleSchemas/Locations';
import { Observations } from '../lib/schemas/SimpleSchemas/Observations';
import { Patients } from '../lib/schemas/SimpleSchemas/Patients';
import { Procedures } from '../lib/schemas/SimpleSchemas/Procedures';
import { Questionnaires } from '../lib/schemas/SimpleSchemas/Questionnaires';
import { QuestionnaireResponses } from '../lib/schemas/SimpleSchemas/QuestionnaireResponses';
import { Goals } from '../lib/schemas/SimpleSchemas/Goals';
import { MedicationAdministrations } from '../lib/schemas/SimpleSchemas/MedicationAdministrations';
import { MedicationRequests } from '../lib/schemas/SimpleSchemas/MedicationRequests';
import { DocumentReferences } from '../lib/schemas/SimpleSchemas/DocumentReferences';
import { AllergyIntolerances } from '../lib/schemas/SimpleSchemas/AllergyIntolerances';
import { ServiceRequests } from '../lib/schemas/SimpleSchemas/ServiceRequests';
import { Communications } from '../lib/schemas/SimpleSchemas/Communications';
import { Compositions } from '../lib/schemas/SimpleSchemas/Compositions';

import { get } from 'lodash';

import PatientCard from './PatientCard';
import FhirUtilities from '../FhirUtilities';
import NoDataWrapper from '../ui/NoDataWrapper';

// Custom styled components for sophisticated design
const StyledCard = function({ children, icon, title, count, expanded, onToggle, ...props }) {
    const theme = useTheme();
    
    return (
        <Card
            sx={{
                mb: 3,
                borderRadius: 2,
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.3s ease',
                '&:hover': {
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
                    transform: 'translateY(-2px)'
                }
            }}
            {...props}
        >
            <CardHeader
                avatar={
                    <Avatar
                        sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main
                        }}
                    >
                        {icon}
                    </Avatar>
                }
                action={
                    onToggle && (
                        <IconButton onClick={onToggle} size="small">
                            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    )
                }
                title={
                    <Box display="flex" alignItems="center" gap={2}>
                        <Typography variant="h6" component="div">
                            {title}
                        </Typography>
                        <Chip
                            label={count}
                            size="small"
                            sx={{
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                                fontWeight: 600
                            }}
                        />
                    </Box>
                }
                sx={{
                    '& .MuiCardHeader-content': {
                        overflow: 'visible'
                    }
                }}
            />
            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <Divider />
                <CardContent sx={{ pt: 2, pb: 2 }}>
                    {children}
                </CardContent>
            </Collapse>
        </Card>
    );
};

const EmptyState = function({ message }) {
    const theme = useTheme();
    
    return (
        <Box
            sx={{
                textAlign: 'center',
                py: 4,
                px: 2,
                color: 'text.secondary'
            }}
        >
            <Typography variant="body2" color="text.secondary">
                {message}
            </Typography>
        </Box>
    );
};

export function AutoDashboard(props){
    logger.info('Rendering the AutoDashboard');
    logger.verbose('app.AutoDashboard');
    logger.data('AutoDashboard.props', {data: props}, {source: "AutoDashboard.jsx"});

    const theme = useTheme();
    const client = useContext(FhirClientContext);
    const navigate = useNavigate();

    // State for expanded sections
    const [expandedSections, setExpandedSections] = useState({
        encounters: true,
        conditions: true,
        immunizations: false,
        procedures: false,
        observations: false,
        careTeams: false,
        carePlans: false,
        consents: false,
        questionnaireResponses: false,
        goals: false,
        locations: false,
        medicationAdministrations: false,
        medicationRequests: false,
        documentReferences: false,
        allergyIntolerances: false,
        serviceRequests: false,
        communications: false,
        compositions: false
    });

    const toggleSection = function(section) {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    let data = {
        careTeams: [],
        carePlans: [],
        encounters: [],
        procedures: [],
        conditions: [],
        consents: [],
        observations: [],
        locations: [],
        immunizations: [],
        selectedPatientId: '',
        selectedPatient: null,
        patients: [],
        questionnaires: [],
        questionnaireResponses: [],
        goals: [],
        medicationAdministrations: [],
        medicationRequests: [],
        documentReferences: [],
        allergyIntolerances: [],
        serviceRequests: [],
        communications: [],
        compositions: [],
        quickchartTabIndex: 0,
        basicQuery: {}
    }

    // Pagination states
    let [careTeamsPage, setCareTeamsPage] = useState(0);
    let [carePlansPage, setCarePlansPage] = useState(0);
    let [encountersPage, setEncountersPage] = useState(0);
    let [proceduresPage, setProceduresPage] = useState(0);
    let [conditionsPage, setConditionsPage] = useState(0);
    let [consentsPage,   setConsentsPage] = useState(0);
    let [observationsPage, setObservationsPage] = useState(0);
    let [locationsPage, setLocationsPage] = useState(0);
    let [immunizationsPage, setImmunizationsPage] = useState(0);
    let [patientsPage, setPatientsPage] = useState(0);
    let [questionnairesPage, setQuestionnairesPage] = useState(0);
    let [questionnaireResponsesPage, setQuestionnaireResponsesPage] = useState(0);
    let [goalsPage, setGoalsPage] = useState(0);
    let [medicationAdministrationsPage, setMedicationAdministrationsPage] = useState(0);
    let [medicationRequestsPage, setMedicationRequestsPage] = useState(0);
    let [documentReferencesPage, setDocumentReferencesPage] = useState(0);
    let [allergyIntolerancesPage, setAllergyIntolerancesPage] = useState(0);
    let [serviceRequestsPage, setServiceRequestsPage] = useState(0);
    let [communicationsPage, setCommunicationsPage] = useState(0);
    let [compositionsPage, setCompositionsPage] = useState(0);

    data.selectedPatientId = useTracker(function(){
        return Session.get('selectedPatientId');
    }, []);
    
    data.selectedPatient = useTracker(function(){
        if(Session.get('selectedPatientId')){
            return Patients.findOne({id: Session.get('selectedPatientId')});
        } else if(get(Session.get('currentUser'), 'patientId')){
            return Patients.findOne({id: get(Session.get('currentUser'), 'patientId')});
        }   
    }, []);
    
    data.patients = useTracker(function(){
        return Patients.find().fetch();
    }, []);

    data.quickchartTabIndex = useTracker(function(){
        return Session.get('quickchartTabIndex')
    }, []);

    data.careTeamTabIndex = useTracker(function(){
        return Session.get('careTeamTabIndex')
    }, []);
    
    data.carePlanTabIndex = useTracker(function(){
        return Session.get('carePlanTabIndex')
    }, []);

    console.log('Autodashboard.data.selectedPatientId', data.selectedPatientId)

    data.basicQuery = useTracker(function(){
        return FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'));
    }, []);

    console.log('Autodashboard.basicQuery', data.basicQuery)

    // Fetch data for all collections
    if(CareTeams){
        data.careTeams = useTracker(function(){
            return CareTeams.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
        }, [])    
    }
    if(CarePlans){
        data.carePlans = useTracker(function(){
            return CarePlans.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
        }, [])    
    }
    if(Consents){
        data.consents = useTracker(function(){
            return Consents.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
        }, [])    
    }
    if(Conditions){
        data.conditions = useTracker(function(){
            return Conditions.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
        }, [])    
    }
    if(Encounters){
        data.encounters = useTracker(function(){
            return Encounters.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
        }, [])   
    }
    if(Immunizations){
        data.immunizations = useTracker(function(){
            return Immunizations.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
        }, [])   
    }
    if(Locations){
        data.locations = useTracker(function(){
            return Locations.find().fetch()
        }, [])   
    }
    if(Procedures){
        data.procedures = useTracker(function(){
            return Procedures.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
        }, [])   
    }
    if(Observations){
        data.observations = useTracker(function(){
            return Observations.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
        }, [])   
    }
    if(Questionnaires){
        data.questionnaires = useTracker(function(){
            return Questionnaires.find().fetch()
        }, [])   
    }
    if(QuestionnaireResponses){
        data.questionnaireResponses = useTracker(function(){
            return QuestionnaireResponses.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
        }, [])   
    }
    if(Goals){
        data.goals = useTracker(function(){
            return Goals.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
        }, [])   
    }
    if(MedicationAdministrations){
        data.medicationAdministrations = useTracker(function(){
            return MedicationAdministrations.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
        }, [])   
    }
    if(MedicationRequests){
        data.medicationRequests = useTracker(function(){
            return MedicationRequests.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
        }, [])   
    }
    if(DocumentReferences){
        data.documentReferences = useTracker(function(){
            return DocumentReferences.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
        }, [])   
    }
    if(AllergyIntolerances){
        data.allergyIntolerances = useTracker(function(){
            return AllergyIntolerances.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
        }, [])   
    }
    if(ServiceRequests){
        data.serviceRequests = useTracker(function(){
            return ServiceRequests.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
        }, [])   
    }
    if(Communications){
        data.communications = useTracker(function(){
            return Communications.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
        }, [])   
    }
    if(Compositions){
        data.compositions = useTracker(function(){
            return Compositions.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
        }, [])   
    }

    console.log('AutoDashboard.data', data);

    let useLocationSearch = useLocation().search;

    let isMobile = false
    if(window.innerWidth < 920){
        isMobile = true;
    }

    // Section content generators
    let careTeamContent = data.careTeams.length > 0 ? (
        <CareTeamsTable
            careTeams={data.careTeams}
            hideCategory={true}
            hideIdentifier={true}
            hideCheckboxes={true}
            hideActionIcons={true}
            hideSubject={true}
            hideBarcode={true}
            count={data.careTeams.length}
            page={careTeamsPage}   
            rowsPerPage={5}    
            onSetPage={function(newPage){
                setCareTeamsPage(newPage);
            }}         
        />
    ) : <EmptyState message="No care teams found" />;

    let carePlansContent = data.carePlans.length > 0 ? (
        <CarePlansTable
            carePlans={data.carePlans}
            count={data.carePlans.length}
            hideCheckboxes={true}
            hideActionIcons={true}
            hideIdentifier={true}
            hideSubject={true}
            page={carePlansPage}
            rowsPerPage={5}
            onSetPage={function(newPage){
                setCarePlansPage(newPage);
            }}
        />
    ) : <EmptyState message="No care plans found" />;

    let consentContent = data.consents.length > 0 ? (
        <ConsentsTable
            hideDates={true}
            hidePeriodStart={true}
            hidePeriodEnd={true}
            hideOrganization={true}
            hideCategory={true}
            hidePatientName={isMobile}
            consents={data.consents}
            count={data.consents.length}
            page={consentsPage}
            rowsPerPage={5}
            onSetPage={function(newPage){
                setConsentsPage(newPage);
            }}
        />
    ) : <EmptyState message="No consents found" />;

    let encountersContent = data.encounters.length > 0 ? (
        <EncountersTable
            encounters={data.encounters}
            hideCheckboxes={true}
            hideActionIcons={true}
            hideSubjects={true}
            hideType={false}
            hideTypeCode={false}
            hideReason={isMobile}
            hideReasonCode={isMobile}
            hideHistory={true}
            hideEndDateTime={true}
            count={data.encounters.length}
            page={encountersPage}
            rowsPerPage={5}
            onSetPage={function(newPage){
                setEncountersPage(newPage);
            }}
        />
    ) : <EmptyState message="No encounters found" />;

    let conditionsContent = data.conditions.length > 0 ? (
        <ConditionsTable
            conditions={data.conditions}
            hideCheckbox={true}
            hideActionIcons={true}
            hideIdentifier={true}
            hidePatientName={true}
            hidePatientReference={true}
            hideAsserterName={true}
            hideEvidence={true}
            hideBarcode={true}
            hideDates={false}
            count={data.conditions.length}
            page={conditionsPage}
            rowsPerPage={5}
            onSetPage={function(newPage){
                setConditionsPage(newPage);
            }}
        />
    ) : <EmptyState message="No conditions found" />;

    let immunizationsContent = data.immunizations.length > 0 ? (
        <ImmunizationsTable
            immunizations={data.immunizations}
            hideCheckbox={true}
            hideIdentifier={true}
            hideActionIcons={true}
            hidePatient={true}
            hidePerformer={true}
            hideVaccineCode={false}
            hideVaccineCodeText={false}
            count={data.immunizations.length}
            page={immunizationsPage}
            rowsPerPage={5}
            onSetPage={function(newPage){
                setImmunizationsPage(newPage);
            }}
        />
    ) : <EmptyState message="No immunizations found" />;

    let observationsContent = data.observations.length > 0 ? (
        <ObservationsTable 
            observations={data.observations}
            hideCheckbox={true}
            hideActionIcons={true}
            hideSubject={true}
            hideDevices={true}
            hideValue={false}
            hideBarcode={true}
            hideDenominator={true}
            hideNumerator={true}
            multiline={true}
            multiComponentValues={true}
            hideSubjectReference={true}
            hideText={true}
            count={data.observations.length}
            page={observationsPage || 0}
            rowsPerPage={5}
            onSetPage={function(newPage){
                setObservationsPage(newPage);
            }}
        />
    ) : <EmptyState message="No observations found" />;

    let proceduresContent = data.procedures.length > 0 ? (
        <ProceduresTable 
            procedures={data.procedures}
            hideCheckbox={true}
            hideActionIcons={true}
            hideIdentifier={true}
            hideCategory={true}
            hideSubject={true}
            hideBodySite={true}
            hideCode={isMobile}
            hidePerformer={isMobile}
            hidePerformedDateEnd={true}
            hideSubjectReference={true}
            hideNotes={isMobile}
            hideBarcode={true}
            count={data.procedures.length}
            page={proceduresPage}
            onSetPage={function(newPage){
                setProceduresPage(newPage);
            }}
        />
    ) : <EmptyState message="No procedures found" />;

    let questionnaireResponsesContent = data.questionnaireResponses.length > 0 ? (
        <QuestionnaireResponsesTable
            questionnaireResponses={data.questionnaireResponses}
            count={data.questionnaireResponses.length}
            hideCheckbox={true}
            hideActionIcons={true}
            hideIdentifier={true}
            hideSubjectDisplay={true}
            hideSubjectReference={true}
            hideSourceReference={true}
            hideBarcode={true}
            page={questionnaireResponsesPage}
            rowsPerPage={5}
            onSetPage={function(newPage){
                setQuestionnaireResponsesPage(newPage);
            }}
        />
    ) : <EmptyState message="No questionnaire responses found" />;


    let goalsContent = data.goals.length > 0 ? (
        <GoalsTable
            goals={data.goals}
            count={data.goals.length}
            hideCheckbox={true}
            hideActionIcons={true}
            hideIdentifier={true}
            hideSubject={true}
            page={goalsPage}
            rowsPerPage={5}
            onSetPage={function(newPage){
                setGoalsPage(newPage);
            }}
        />
    ) : <EmptyState message="No goals found" />;


    let locationsContent = data.locations.length > 0 ? (
        <LocationsTable
            locations={data.locations}
            count={data.locations.length}
            hideCheckbox={true}
            hideActionIcons={true}
            hideIdentifier={true}
            hideBarcode={true}
            page={locationsPage}
            rowsPerPage={5}
            onSetPage={function(newPage){
                setLocationsPage(newPage);
            }}
        />
    ) : <EmptyState message="No locations found" />;

    let medicationAdministrationsContent = data.medicationAdministrations.length > 0 ? (
        <MedicationAdministrationsTable
            medicationAdministrations={data.medicationAdministrations}
            count={data.medicationAdministrations.length}
            hideCheckbox={true}
            hideActionIcons={true}
            hideIdentifier={true}
            hidePatient={true}
            page={medicationAdministrationsPage}
            rowsPerPage={5}
            onSetPage={function(newPage){
                setMedicationAdministrationsPage(newPage);
            }}
        />
    ) : <EmptyState message="No medication administrations found" />;

    let medicationRequestsContent = data.medicationRequests.length > 0 ? (
        <MedicationRequestsTable
            medicationRequests={data.medicationRequests}
            count={data.medicationRequests.length}
            hideCheckbox={true}
            hideActionIcons={true}
            hideIdentifier={true}
            hidePatientReference={true}
            hidePatientName={true}
            page={medicationRequestsPage}
            rowsPerPage={5}
            onSetPage={function(newPage){
                setMedicationRequestsPage(newPage);
            }}
        />
    ) : <EmptyState message="No medication requests found" />;

    let documentReferencesContent = data.documentReferences.length > 0 ? (
        <DocumentReferencesTable
            documentReferences={data.documentReferences}
            count={data.documentReferences.length}
            hideCheckbox={true}
            hideActionIcons={true}
            hideIdentifier={true}
            hideSubjectDisplay={true}
            hideSubjectReference={true}
            hideAuthor={true}
            hideBarcode={true}
            hideType={false}
            hideCategory={true}
            multiline={false}
            page={documentReferencesPage}
            rowsPerPage={5}
            onSetPage={function(newPage){
                setDocumentReferencesPage(newPage);
            }}
        />
    ) : <EmptyState message="No document references found" />;

    let allergyIntolerancesContent = data.allergyIntolerances.length > 0 ? (
        <AllergyIntolerancesTable
            allergyIntolerances={data.allergyIntolerances}
            count={data.allergyIntolerances.length}
            hideCheckbox={true}
            hideActionIcons={true}
            hideIdentifier={true}
            hidePatientDisplay={true}
            hideBarcode={true}
            hideVerification={true}
            hideClinicalStatus={false}
            multiline={false}
            page={allergyIntolerancesPage}
            rowsPerPage={5}
            onSetPage={function(newPage){
                setAllergyIntolerancesPage(newPage);
            }}
        />
    ) : <EmptyState message="No allergies or intolerances found" />;

    let serviceRequestsContent = data.serviceRequests.length > 0 ? (
        <ServiceRequestsTable
            serviceRequests={data.serviceRequests}
            count={data.serviceRequests.length}
            hideCheckbox={true}
            hideActionIcons={true}
            hideIdentifier={true}
            hideSubject={true}
            hideRequestorReference={true}
            hideText={true}
            page={serviceRequestsPage}
            rowsPerPage={5}
            onSetPage={function(newPage){
                setServiceRequestsPage(newPage);
            }}
        />
    ) : <EmptyState message="No service requests found" />;

    let communicationsContent = data.communications.length > 0 ? (
        <CommunicationsTable
            communications={data.communications}
            count={data.communications.length}
            hideCheckbox={true}
            hideActionIcons={true}
            hideIdentifier={true}
            hideSubject={true}
            page={communicationsPage}
            rowsPerPage={5}
            onSetPage={function(newPage){
                setCommunicationsPage(newPage);
            }}
        />
    ) : <EmptyState message="No communications found" />;

    let compositionsContent = data.compositions.length > 0 ? (
        <CompositionsTable
            compositions={data.compositions}
            count={data.compositions.length}
            hideCheckbox={true}
            hideActionIcons={true}
            hideIdentifier={true}
            hideSubject={true}
            hideSubjectReference={true}
            hideEncounterReference={true}
            hideType={true}
            hideCategory={true}
            multiline={false}
            page={compositionsPage}
            rowsPerPage={5}
            onSetPage={function(newPage){
                setCompositionsPage(newPage);
            }}
        />
    ) : <EmptyState message="No compositions found" />;


    // Main dashboard layout
    let patientChartLayout = (
        <Fade in={true} timeout={800}>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 10, pb: '100px' }}>
                {/* Patient Header */}
                <Box sx={{ mb: 4 }}>
                    <PatientCard 
                        patient={data.selectedPatient} 
                        showBarcode={false}
                        showDetails={true}
                        showSummary={true}
                        showName={true}
                    />
                </Box>

                {/* Clinical Data Sections */}
                <Stack spacing={0}>
                    {/* Primary Clinical Data */}
                    <Box sx={{ mb: 2 }}>
                        <Typography 
                            variant="overline" 
                            color="text.secondary" 
                            sx={{ fontWeight: 600, letterSpacing: 1.5 }}
                        >
                            Clinical History
                        </Typography>
                    </Box>

                    {data.encounters.length > 0 && (
                        <StyledCard
                            icon={<EventNoteIcon />}
                            title="Encounters"
                            count={data.encounters.length}
                            expanded={expandedSections.encounters}
                            onToggle={() => toggleSection('encounters')}
                        >
                            {encountersContent}
                        </StyledCard>
                    )}

                    {data.conditions.length > 0 && (
                        <StyledCard
                            icon={<LocalHospitalIcon />}
                            title="Conditions"
                            count={data.conditions.length}
                            expanded={expandedSections.conditions}
                            onToggle={() => toggleSection('conditions')}
                        >
                            {conditionsContent}
                        </StyledCard>
                    )}

                    {data.allergyIntolerances.length > 0 && (
                        <StyledCard
                            icon={<WarningIcon />}
                            title="Allergies & Intolerances"
                            count={data.allergyIntolerances.length}
                            expanded={expandedSections.allergyIntolerances}
                            onToggle={() => toggleSection('allergyIntolerances')}
                        >
                            {allergyIntolerancesContent}
                        </StyledCard>
                    )}

                    {/* Treatments & Interventions */}
                    {(data.immunizations.length > 0 || data.procedures.length > 0 || data.medicationAdministrations.length > 0 || data.medicationRequests.length > 0 || data.serviceRequests.length > 0) && (
                        <>
                            <Box sx={{ mb: 2, mt: 4 }}>
                                <Typography 
                                    variant="overline" 
                                    color="text.secondary" 
                                    sx={{ fontWeight: 600, letterSpacing: 1.5 }}
                                >
                                    Treatments & Interventions
                                </Typography>
                            </Box>

                            {data.immunizations.length > 0 && (
                                <StyledCard
                                    icon={<VaccinesIcon />}
                                    title="Immunizations"
                                    count={data.immunizations.length}
                                    expanded={expandedSections.immunizations}
                                    onToggle={() => toggleSection('immunizations')}
                                >
                                    {immunizationsContent}
                                </StyledCard>
                            )}

                            {data.procedures.length > 0 && (
                                <StyledCard
                                    icon={<MedicalServicesIcon />}
                                    title="Procedures"
                                    count={data.procedures.length}
                                    expanded={expandedSections.procedures}
                                    onToggle={() => toggleSection('procedures')}
                                >
                                    {proceduresContent}
                                </StyledCard>
                            )}

                            {data.medicationRequests.length > 0 && (
                                <StyledCard
                                    icon={<MedicationIcon />}
                                    title="Medication Requests"
                                    count={data.medicationRequests.length}
                                    expanded={expandedSections.medicationRequests}
                                    onToggle={() => toggleSection('medicationRequests')}
                                >
                                    {medicationRequestsContent}
                                </StyledCard>
                            )}

                            {data.medicationAdministrations.length > 0 && (
                                <StyledCard
                                    icon={<MedicationIcon />}
                                    title="Medication Administrations"
                                    count={data.medicationAdministrations.length}
                                    expanded={expandedSections.medicationAdministrations}
                                    onToggle={() => toggleSection('medicationAdministrations')}
                                >
                                    {medicationAdministrationsContent}
                                </StyledCard>
                            )}

                            {data.serviceRequests.length > 0 && (
                                <StyledCard
                                    icon={<MedicalInformationIcon />}
                                    title="Service Requests"
                                    count={data.serviceRequests.length}
                                    expanded={expandedSections.serviceRequests}
                                    onToggle={() => toggleSection('serviceRequests')}
                                >
                                    {serviceRequestsContent}
                                </StyledCard>
                            )}
                        </>
                    )}

                    {/* Measurements & Assessments */}
                    {(data.observations.length > 0 || data.questionnaireResponses.length > 0) && (
                        <>
                            <Box sx={{ mb: 2, mt: 4 }}>
                                <Typography 
                                    variant="overline" 
                                    color="text.secondary" 
                                    sx={{ fontWeight: 600, letterSpacing: 1.5 }}
                                >
                                    Measurements & Assessments
                                </Typography>
                            </Box>

                            {data.observations.length > 0 && (
                                <StyledCard
                                    icon={<MonitorHeartIcon />}
                                    title="Observations"
                                    count={data.observations.length}
                                    expanded={expandedSections.observations}
                                    onToggle={() => toggleSection('observations')}
                                >
                                    {observationsContent}
                                </StyledCard>
                            )}

                            {data.questionnaireResponses.length > 0 && (
                                <StyledCard
                                    icon={<AssignmentIcon />}
                                    title="Questionnaire Responses"
                                    count={data.questionnaireResponses.length}
                                    expanded={expandedSections.questionnaireResponses}
                                    onToggle={() => toggleSection('questionnaireResponses')}
                                >
                                    {questionnaireResponsesContent}
                                </StyledCard>
                            )}
                        </>
                    )}

                    {/* Care Coordination */}
                    {(data.careTeams.length > 0 || data.carePlans.length > 0 || data.consents.length > 0) && (
                        <>
                            <Box sx={{ mb: 2, mt: 4 }}>
                                <Typography 
                                    variant="overline" 
                                    color="text.secondary" 
                                    sx={{ fontWeight: 600, letterSpacing: 1.5 }}
                                >
                                    Care Coordination
                                </Typography>
                            </Box>

                            {data.careTeams.length > 0 && (
                                <StyledCard
                                    icon={<GroupIcon />}
                                    title="Care Teams"
                                    count={data.careTeams.length}
                                    expanded={expandedSections.careTeams}
                                    onToggle={() => toggleSection('careTeams')}
                                >
                                    {careTeamContent}
                                </StyledCard>
                            )}

                            {data.carePlans.length > 0 && (
                                <StyledCard
                                    icon={<DescriptionIcon />}
                                    title="Care Plans"
                                    count={data.carePlans.length}
                                    expanded={expandedSections.carePlans}
                                    onToggle={() => toggleSection('carePlans')}
                                >
                                    {carePlansContent}
                                </StyledCard>
                            )}

                            {data.consents.length > 0 && (
                                <StyledCard
                                    icon={<VerifiedUserIcon />}
                                    title="Consents"
                                    count={data.consents.length}
                                    expanded={expandedSections.consents}
                                    onToggle={() => toggleSection('consents')}
                                >
                                    {consentContent}
                                </StyledCard>
                            )}
                        </>
                    )}


                    {/* Care Planning */}
                    {data.goals.length > 0 && (
                        <>
                            <Box sx={{ mb: 2, mt: 4 }}>
                                <Typography 
                                    variant="overline" 
                                    color="text.secondary" 
                                    sx={{ fontWeight: 600, letterSpacing: 1.5 }}
                                >
                                    Care Planning
                                </Typography>
                            </Box>

                            <StyledCard
                                icon={<FlagIcon />}
                                title="Goals"
                                count={data.goals.length}
                                expanded={expandedSections.goals}
                                onToggle={() => toggleSection('goals')}
                            >
                                {goalsContent}
                            </StyledCard>
                        </>
                    )}


                    {/* Clinical Documentation */}
                    {(data.documentReferences.length > 0 || data.communications.length > 0 || data.compositions.length > 0) && (
                        <>
                            <Box sx={{ mb: 2, mt: 4 }}>
                                <Typography 
                                    variant="overline" 
                                    color="text.secondary" 
                                    sx={{ fontWeight: 600, letterSpacing: 1.5 }}
                                >
                                    Clinical Documentation
                                </Typography>
                            </Box>

                            {data.documentReferences.length > 0 && (
                                <StyledCard
                                    icon={<AttachFileIcon />}
                                    title="Document References"
                                    count={data.documentReferences.length}
                                    expanded={expandedSections.documentReferences}
                                    onToggle={() => toggleSection('documentReferences')}
                                >
                                    {documentReferencesContent}
                                </StyledCard>
                            )}

                            {data.communications.length > 0 && (
                                <StyledCard
                                    icon={<ChatIcon />}
                                    title="Communications"
                                    count={data.communications.length}
                                    expanded={expandedSections.communications}
                                    onToggle={() => toggleSection('communications')}
                                >
                                    {communicationsContent}
                                </StyledCard>
                            )}

                            {data.compositions.length > 0 && (
                                <StyledCard
                                    icon={<ArticleIcon />}
                                    title="Compositions"
                                    count={data.compositions.length}
                                    expanded={expandedSections.compositions}
                                    onToggle={() => toggleSection('compositions')}
                                >
                                    {compositionsContent}
                                </StyledCard>
                            )}
                        </>
                    )}

                    {/* Locations */}
                    {data.locations.length > 0 && (
                        <>
                            <Box sx={{ mb: 2, mt: 4 }}>
                                <Typography 
                                    variant="overline" 
                                    color="text.secondary" 
                                    sx={{ fontWeight: 600, letterSpacing: 1.5 }}
                                >
                                    Locations
                                </Typography>
                            </Box>

                            <StyledCard
                                icon={<PlaceIcon />}
                                title="Locations"
                                count={data.locations.length}
                                expanded={expandedSections.locations}
                                onToggle={() => toggleSection('locations')}
                            >
                                {locationsContent}
                            </StyledCard>
                        </>
                    )}
                </Stack>
            </Container>
        </Fade>
    );

    let autoDashboardContent = patientChartLayout;

    let autoDashboardNoDataPath = get(Meteor, 'settings.public.smartOnFhir.autoDashboardNoDataPath', '/patients');

    // If no patient is selected, show the no data wrapper
    if (!data.selectedPatient) {
        return (
            <Box 
                id="autoDashboardPage" 
                sx={{
                    minHeight: '100vh',
                    backgroundColor: 'background.default',
                    px: { xs: 2, sm: 3, md: 4 },
                    py: { xs: 3, sm: 4, md: 5 },
                    overflowY: 'auto',
                    height: '100%'
                }}
            >
                <Box 
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '50vh',
                        textAlign: 'center'
                    }}
                >
                    <Card 
                        sx={{ 
                            maxWidth: '600px',
                            width: '100%',
                            borderRadius: 3,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            border: '1px solid',
                            borderColor: 'divider',
                            backgroundColor: 'background.paper'
                        }}
                    >
                        <CardContent sx={{ p: 6 }}>
                            <Box sx={{ mb: 3 }}>
                                <Typography 
                                    variant="h5" 
                                    sx={{ 
                                        fontWeight: 500,
                                        color: 'text.primary',
                                        mb: 2
                                    }}
                                >
                                    No Patient Selected
                                </Typography>
                                <Typography 
                                    variant="body1" 
                                    sx={{ 
                                        color: 'text.secondary',
                                        lineHeight: 1.7,
                                        maxWidth: '480px',
                                        mx: 'auto'
                                    }}
                                >
                                    Please select a patient to view their comprehensive medical dashboard. The dashboard will display encounters, conditions, procedures, observations, and other clinical data.
                                </Typography>
                            </Box>
                            <Button
                                variant="outlined"
                                startIcon={<GroupIcon />}
                                onClick={() => navigate(autoDashboardNoDataPath)}
                                sx={{
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    px: 3,
                                    py: 1,
                                    borderWidth: 2,
                                    '&:hover': {
                                        borderWidth: 2
                                    }
                                }}
                            >
                                Browse Patients
                            </Button>
                        </CardContent>
                    </Card>
                </Box>
            </Box>
        );
    }

    return (
        <Box
            id="autoDashboardPage"
            sx={{
                height: '100%',
                overflowY: 'auto',
                overflowX: 'hidden'
            }}
        >
            {autoDashboardContent}
        </Box>
    );
}

export default AutoDashboard;
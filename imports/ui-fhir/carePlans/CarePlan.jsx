import React from 'react';
// import { ListGroupItem, FormControl, Button } from 'react-bootstrap';
import { updateCarePlan, removeCarePlan } from '../../../api/careplans/methods.js';


const handleUpdateCarePlan = (carePlanId, event) => {
  const title = event.target.value.trim();
  if (title !== '' && event.keyCode === 13) {
    updateCarePlan.call({
      _id: carePlanId,
      update: { title }
    }, (error) => {
      if (error) {
        // Bert.alert(error.reason, 'danger');
      } else {
        // Bert.alert('CarePlan updated!', 'success');
      }
    });
  }
};

const handleRemoveCarePlan = (documentId, event) => {
  event.preventDefault();
  // this should be replaced with a styled solution so for now we will
  // disable the eslint `no-alert`
  // eslint-disable-next-line no-alert
  if (confirm('Are you sure? This is permanent.')) {
    removeCarePlan.call({
      _id: documentId
    }, (error) => {
      if (error) {
        // Bert.alert(error.reason, 'danger');
      } else {
        // Bert.alert('CarePlan removed!', 'success');
      }
    });
  }
};

export const CarePlan = ({ carePlan }) => (
  // <ListGroupItem key={ carePlan._id }>
    <Grid container>
      <Grid item xs={ 2 } sm={ 1 }>
        {/* <FormControl
          type="text"
          standalone
          defaultValue={ carePlan.carePlanType }
          onKeyUp={ handleUpdateCarePlan.bind(this, carePlan._id) }
        /> */}
      </Grid>
      <Grid item xs={ 2 } sm={ 1 }>
        {/* <FormControl
          type="text"
          standalone
          defaultValue={ carePlan.carePlanValue }
          onKeyUp={ handleUpdateCarePlan.bind(this, carePlan._id) }
        /> */}
      </Grid>
      <Grid item xs={ 2 } sm={ 1 }>
        {/* <FormControl
          type="text"
          standalone
          defaultValue={ carePlan.createdAt }
          onKeyUp={ handleUpdateCarePlan.bind(this, carePlan._id) }
        /> */}
      </Grid>
      <Grid item xs={ 2 } sm={ 1 }>
        {/* <FormControl
          type="text"
          standalone
          defaultValue={ carePlan.patientId }
          onKeyUp={ handleUpdateCarePlan.bind(this, carePlan._id) }
        /> */}
      </Grid>
      <Grid item xs={ 3 } sm={ 2 }>
        {/* <Button
          bsStyle="danger"
          className="btn-block"
          onClick={ handleRemoveCarePlan.bind(this, carePlan._id) }>
          Remove
        </Button> */}
      </Grid>
    </Grid>
  // </ListGroupItem>
);

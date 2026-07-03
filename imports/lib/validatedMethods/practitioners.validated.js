
import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import { Accounts } from 'meteor/accounts-base';
import { check, Match } from 'meteor/check';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

export const insertPractitioner = new ValidatedMethod({
  name: 'practitioners.insert',
  validate(document) {
    check(document, Object);
    check(document.name, Match.Optional(String));
    check(document.telecomValue, Match.Optional(String));
    check(document.telecomUse, Match.Optional(String));
    check(document.qualificationId, Match.Optional(String));
    check(document.qualificationStart, Match.Optional(String));
    check(document.qualificationEnd, Match.Optional(String));
    check(document.issuer, Match.Optional(String));
  },
  run(document) {
    console.log("insertPractitioner");
    console.log("document", document);

    // temporary; until we figure out FormHelpers?
    // document = FormHelpers.convertBirthdateToValidDate(document);
    delete document.qualificationStart;
    delete document.qualificationEnd;

    let newPractitioner = {
      name: {
        text: ""
      },
      telecom: [{
        system: 'phone',
        value: '',
        use: 'primary',
        rank: '1'
      }],
      qualification: [{
        identifier: [{
          use: 'certficate',
          value: '',
          period: {
            start: null,
            end: null
          }
        }],
        issuer: {
          display: "",
          reference: ""
        }
      }]
    };
    if (document.name) {
      newPractitioner.name.text = document.name;
    }

    if (document.telecomValue) {
      newPractitioner.telecom[0].value = document.telecomValue;
    }
    if (document.telecomUse) {
      newPractitioner.telecom[0].use = document.telecomUse;
    }
    if (document.qualificationId) {
      newPractitioner.qualification[0].identifier[0].value = document.qualificationId;
    }
    if (document.issuer) {
      newPractitioner.qualification[0].issuer.display = document.issuer;
    }
    if (document.qualificationStart) {
      newPractitioner.telecom[0].identifier[0].period.start = document.qualificationStart;
    }
    if (document.qualificationEnd) {
      newPractitioner.telecom[0].identifier[0].period.end = document.qualificationEnd;
    }
    if (process.env.NODE_ENV === "test") {
      newPractitioner.test = true;
    } else {
      newPractitioner.test = false;
    }

    console.log("newPractitioner", newPractitioner);


    // now that's all done, we can insert the document
    return Practitioners.insert(newPractitioner);
  }
});

export const updatePractitioner = new ValidatedMethod({
  name: 'practitioners.update',
  validate({ _id, update }) {
    check(_id, String);
    check(update, Match.Optional(Object));
  },
  run({ _id, update }) {
    console.log("updatePractitioner");
    console.log("_id", _id);
    console.log("update", update);

    let practitioner = Practitioners.findOne({_id: _id});

    delete practitioner._id;
    delete practitioner._document;
    delete practitioner._super_;
    delete practitioner._collection;

    if (update.name) {
      practitioner.name.text = update.name;
    }
    if (update.telecomValue) {
      practitioner.telecom[0].value = update.telecomValue;
    }
    if (update.telecomUse) {
      practitioner.telecom[0].use = update.telecomUse;
    }
    if (update.qualificationId) {
      practitioner.qualification[0].identifier[0].value = update.qualificationId;
    }
    if (update.issuer) {
      practitioner.qualification[0].issuer.display = update.issuer;
    }
    if (update.qualificationStart) {
      practitioner.qualification[0].identifier[0].period.start = moment(update.qualificationStart).toDate();
    }
    if (update.qualificationEnd) {
      practitioner.qualification[0].identifier[0].period.end = moment(update.qualificationEnd).toDate();
    }


    console.log("diffedPractitioner", practitioner);
    return Practitioners.update(_id, { $set: practitioner }, function(error){
      if (error) {
        console.log("error", error);
      }
    });
  }
});

export const removePractitionerById = new ValidatedMethod({
  name: 'practitioners.removeById',
  validate({ _id }) {
    check(_id, String);
  },
  run({ _id }) {
    console.log("Removing user " + _id);
    Practitioners.remove({_id: _id});
  }
});

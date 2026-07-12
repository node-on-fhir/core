
import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import { Accounts } from 'meteor/accounts-base';
import { check, Match } from 'meteor/check';
import { ValidatedMethod } from 'meteor/mdg:validated-method';



export const insertConsent = new ValidatedMethod({
  name: 'consents.insert',
  validate(document) {
    // 'name.$.text': { type: String },
    // 'identifier': { type: [ String ], optional: true },
    // 'gender': { type: String, optional: true },
    // 'active': { type: Boolean, optional: true },
    // 'birthDate': { type: String, optional: true },
    // 'photo.$.url': { type: String, optional: true }
    check(document, Object);
  },
  run(document) {

    console.log("insertConsent", document);

    // document = convertBirthdateToValidDate(document);
    // console.log("convertBirthdateToValidDate", document);

    if (process.env.NODE_ENV === "test") {
      document.test = true;
    } else {
      document.test = false;
    }

    // now that's all done, we can insert the document
    return Consents.insert(document);
  }
});

export const updateConsent = new ValidatedMethod({
  name: 'consents.update',
  validate({ _id, update }) {
    check(_id, String);
    check(update, Match.Optional(Object));
  },
  run({ _id, update }) {
    console.log("updateConsent");
    console.log("_id", _id);
    console.log("update", update);

    // update = convertBirthdateToValidDate(update);

    let consent = Consents.findOne({_id: _id});

    delete consent._id;
    delete consent._document;
    delete consent._super_;
    delete consent._collection;

    console.log("update.name", update.name);
    update.name[0].resourceType = 'HumanName';



    consent.name = [];
    consent.name.push(update.name[0]);
    consent.gender = update.gender;
    consent.photo = [];

    if (update.birthDate) {
      consent.birthDate = update.birthDate;
    }
    if (update && update.photo && update.photo[0] && update.photo[0].url) {
      consent.photo.push({
        url: update.photo[0].url
      });
    }

    console.log("diffedConsent", consent);
    return Consents.update({_id: _id}, { $set: consent });
  }
});

export const removeConsentById = new ValidatedMethod({
  name: 'consents.removeById',
  validate({ _id }) {
    check(_id, String);
  },
  run({ _id }) {
    console.log("Removing user " + _id);
    return Consents.remove({_id: _id});
  }
});

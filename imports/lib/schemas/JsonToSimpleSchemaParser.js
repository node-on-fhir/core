import { each, reduce, isArray, defaults, get } from 'lodash';
import SimpleSchema from 'simpl-schema';

const JsonToSimpleSchemaParser = function(fhirDefinition, resourceType) {
	var root = this;
	this.rawSchema = fhirDefinition;

	if (typeof fhirDefinition !== 'object') {
		throw new Error('fhirDefinition parameter must be an object');
	}

	var jsonSchema = fhirDefinition;

    
    // console.debug('> JsonToSimpleSchemaParser.fhirDefinition', fhirDefinition);

	this.toSimpleSchemaProps = function toSimpleSchemaProps(resourceType) {
		var properties = fhirDefinition;


        let resourceDefinition = get(fhirDefinition, 'definitions.' + resourceType)

        // if(typeof resourceType === "string"){
        //     console.debug('JsonToSimpleSchemaParser.fhirDefinition.' + resourceType, resourceDefinition);
        // }

        
        // console.debug('toSimpleSchemaProps()');
        // console.debug('toSimpleSchemaProps().fhirDefinition', fhirDefinition);

		return translateProperties(fhirDefinition, getRequiredFromProperty(resourceDefinition), resourceType);
	}

	this.generateSimpleSchema = function generateSimpleSchema(resourceType) {

        var simpleSchemaProps = this.toSimpleSchemaProps(resourceType);
        // console.debug('simpleSchemaProps', simpleSchemaProps);

        if(simpleSchemaProps){
            return new SimpleSchema(simpleSchemaProps);
        } else {
            return new SimpleSchema();
        }
	}

	function translateProperties(fhirDefinition, required, resourceType) {
        // console.debug('translateProperties()', fhirDefinition, required)


		var schema = {};

		each(fhirDefinition, function(prop, key) {
			prop = resolveReference(prop);
            // console.debug('translateProperties().each().key', key)

            if(key === "definitions"){
                // console.debug('fhirDefinition().definitions', prop)
                // console.debug('fhirDefinition().definitions.' + resourceType, prop[resourceType])

                if(typeof prop[resourceType].properties === "object"){
                    Object.keys(prop[resourceType].properties).forEach(function(key){

                        let originalSchema = prop[resourceType].properties[key];

                        let newSchema = {
                            type: String,
                            optional: true
                        }

                        if(get(originalSchema, 'type') === "array"){
                            newSchema.type = Array;
                            schema[key] = newSchema;

                            schema[key + ".$"] = {
                                type: Object
                            };

                        } else if(get(originalSchema, 'type') === "boolean"){
                            newSchema.type = Boolean;
                            schema[key] = newSchema;
                        } else if(get(originalSchema, 'type') === "String"){
                            newSchema.type = String;
                            schema[key] = newSchema;
                        } else {
                            newSchema.type = Object;
                            schema[key] = newSchema;
                        }

                    })
                }
            }

			var blackbox = getBlackboxFromProperty(prop);
            if(key === "definitions"){
                // console.debug('fhirDefinition().definitions.blackbox', blackbox)


            }
            
			var ssProp = {};
			addRules(ssProp, prop, required.indexOf(key) !== -1, blackbox);
            if(key === "definitions"){
                // console.debug('fhirDefinition().definitions.ssProp', ssProp)
            }

			// if (Meteor.isClient) {
			// 	addAutoformAttributes(ssProp, prop);
			// }

			schema[key] = ssProp;
			var subProps = getSubPropertiesFromProperty(prop);

			if (subProps && !blackbox) {
				var subSchema = translateProperties(subProps, getRequiredFromProperty(prop));

				each(subSchema, function(subProp, subKey) {
					schema[key + '.' + (prop.type === 'array' ? '$.' : '') + subKey] = subProp;
				});
			}
		});

		return schema;
	}

	function getTypeFromProperty(prop) {
        let propType = typeof prop;
        // console.debug('getTypeFromProperty.prop', prop);

        var ssType = String;

        if(prop){
            var format = prop.format;
            
            if(typeof prop === "array"){
                propType = prop.items.type;
    
            } else {
                propType = prop.type;
            }
    
            switch (propType) {
                case 'integer':
                case 'number':
                    ssType = Number;
                    break;
                case 'boolean':
                    ssType = Boolean;
                    break;
                case 'object':
                    ssType = Object;
                    break;
                default:
                    if (format === 'date' || format === 'date-time') {
                        ssType = Date;
                    } else {
                        ssType = String;
                    }
                    break;
            }

            if(typeof prop === "array"){
                return [ssType];
    
            } else {
                return ssType;
            }
    
        } else {
            return ssType;
        }
	}

	function getSubPropertiesFromProperty(prop) {
        if(typeof prop === "object"){
            if (prop.properties) {
                return prop.properties;
            } else if (prop.type === 'array' && prop.items && prop.items.type === 'object' && prop.items.properties) {
                return prop.items.properties;
            } else {
                return null;
            }
        } else {
            return null;
        }
	}

	function getRequiredFromProperty(prop) {
        // console.debug('translateProperties()', prop)
        if(typeof prop === "object"){
            if (prop.properties) {
                return prop.required || [];
            } else if (prop.type === 'array' && prop.items && prop.items.type === 'object' && prop.items.properties) {
                return prop.items.required || [];
            } else {
                return [];
            }
        } else {
            return [];
        }
	}

	function getBlackboxFromProperty(prop) {
        if(typeof prop === "object"){
            if (prop.additionalProperties) {
                return true;
            } else if (prop.type === 'array' && prop.items && prop.items.type === 'object' && prop.items.additionalProperties) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
	}

	var translationMap = {
		title: {key: 'label'},
		minimum: {key: 'min', type: Number},
		maximum: {key: 'max', type: Number},
		exclusiveMinimum: {key: 'exclusiveMin', type: Boolean},
		exclusiveMaximum: {key: 'exclusiveMax', type: Boolean},
		minLength: {key: 'min', type: Number},
		maxLength: {key: 'max', type: Number},
		minItems: {key: 'minCount', type: Number},
		maxItems: {key: 'maxCount', type: Number},
		'default': {key: 'defaultValue'}
	}

	function addRules(target, source, isRequired, isBlackbox) {

        if(source){
            target.type = getTypeFromProperty(source);

            each(translationMap, function(sKey, jKey) {
                if (typeof source[jKey] !== 'undefined') {
                    target[sKey.key] = sKey.type ? sKey.type(source[jKey]) : source[jKey];
                }
            });
    
            target.optional = !isRequired;
    
            if (isBlackbox) {
                target.blackbox = isBlackbox;
            }
    
            if (source.enum) {
                target.allowedValues = source.enum.filter(function(item) {return item !== null;});
            }
    
            if (source.pattern) {
                target.regEx = new RegExp(source.pattern);
            }
    
            if (!source.pattern && source.format === 'email') {
                target.regEx = SimpleSchema.RegEx.Email;
            } else if (!source.pattern && (source.format === 'host-name' || source.format === 'hostname')) {
                target.regEx = SimpleSchema.RegEx.Domain;
            } else if (!source.pattern && source.format === 'ipv4') {
                target.rexEx = SimpleSchema.RegEx.IPv4;
            } else if (!source.pattern && source.format === 'ipv6') {
                target.rexEx = SimpleSchema.RegEx.IPv6;
            } else if (source.type === 'number' || (source.type === 'array' && source.items && source.items.type === 'number')) {
                target.decimal = true;
            }
        } 
	}

	function attachAutoformObject(target) {
		if (!target.autoform) {
			target.autoform = {}
		}

		if (!target.autoform.afFieldInput) {
			target.autoform.afFieldInput = {};
		}
	}

	function addAutoformAttributes(target, source) {
        if(source){
            if (source.description) {
                attachAutoformObject(target);
                target.autoform.afFieldInput.title = source.description;
            }
    
            if (source.format === 'date-time') {
                attachAutoformObject(target);
                target.autoform.afFieldInput.type = 'datetime';
            }
    
            if (target.allowedValues && target.optional) {
                attachAutoformObject(target);
                target.autoform.afFieldInput.firstOption = '(None)';
            }    
        }
	}

	// https://tools.ietf.org/id/draft-pbryan-zyp-json-ref-03.html
	// https://tools.ietf.org/html/draft-ietf-appsawg-json-pointer-04
	function resolveReference(prop) {
		var $ref;
        if(prop){
            if ($ref = prop.$ref) {
                if ($ref === '#') {
                    // Prevent infinite recursion.
                    return {type: jsonSchema.type || 'object'};
                } else if ($ref.substring(0, 2) === '#/') {
                    var refParts = decodeURIComponent($ref).substring(2).split('/');
                    var out = reduce(refParts, function(memo, refPart) {
                        if (isArray(memo)) {
                            return memo[parseInt(refPart)];
                        } else if(memo){
                            refPart = refPart.replace('~1', '/').replace('~0', '~');
                            return memo[refPart]; 
                        }
                    }, jsonSchema);
    
                    return resolveReference(out);
                } else {
                    throw new Error('Non-internal or relative JSON references not yet implemented');
                }
            } else {
                if (prop.items && prop.items.$ref) {
                    return defaults({items: resolveReference(prop.items)}, prop);
                }
    
                return prop;
            }    
        } else {
            // console.debug('resolveReference().prop undefined');
            return;
        }

	}
};

export default JsonToSimpleSchemaParser;
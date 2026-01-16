export const RecordLifecycleHooks = [{
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "default": "record-originate"
      },
      "recordId": {
        "type": "string"
      },
      "userId": {
        "type": "string"
      }
    },
    "required": ["recordId"],
    "additionalProperties": false
  }, {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "default": "record-amend"
      },
      "recordId": {
        "type": "string"
      },
      "userId": {
        "type": "string"
      }
    },
    "required": ["recordId"],
    "additionalProperties": false
  }, {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "default": "record-translate"
      },
      "recordId": {
        "type": "string"
      }
    },
    "required": ["recordId"],
    "additionalProperties": false
  }, {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "default": "record-attest"
      },
      "recordId": {
        "type": "string"
      },
      "userId": {
        "type": "string"
      }
    },
    "required": ["recordId"],
    "additionalProperties": false
  }, {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "default": "record-access"
      },
      "recordId": {
        "type": "string"
      },
      "userId": {
        "type": "string"
      }
    },
    "required": ["recordId"],
    "additionalProperties": false
  }, {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "default": "record-view"
      },
      "recordId": {
        "type": "string"
      },
      "userId": {
        "type": "string"
      }
    },
    "required": ["recordId"],
    "additionalProperties": false
  }, {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "default": "record-report"
      },
      "recordId": {
        "type": "string"
      },
      "userId": {
        "type": "string"
      }
    },
    "required": ["recordId"],
    "additionalProperties": false
  }, {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "default": "record-disclose"
      },
      "recordId": {
        "type": "string"
      },
      "userId": {
        "type": "string"
      }
    },
    "required": ["recordId"],
    "additionalProperties": false
  }, {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "default": "record-transmit"
      },
      "recordId": {
        "type": "string"
      },
      "userId": {
        "type": "string"
      },
      "destinationId": {
        "type": "string"
      },
      "destinationAddress": {
        "type": "string"
      }
    },
    "required": ["recordId", "destinationAddress"],
    "additionalProperties": false
  }, {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "default": "record-receive"
      },
      "recordId": {
        "type": "string"
      }
    },
    "required": ["recordId"],
    "additionalProperties": false
  }, {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "default": "record-anonymize"
      },
      "recordId": {
        "type": "string"
      },
      "userId": {
        "type": "string"
      }
    },
    "required": ["recordId"],
    "additionalProperties": false
  }, {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "default": "record-pseudoanonymize"
      },
      "recordId": {
        "type": "string"
      },
      "userId": {
        "type": "string"
      }
    },
    "required": ["recordId"],
    "additionalProperties": false
  }, {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "default": "record-reidentify"
      },
      "recordId": {
        "type": "string"
      },
      "userId": {
        "type": "string"
      }
    },
    "required": ["recordId"],
    "additionalProperties": false
  }, {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "default": "record-extract"
      },
      "recordId": {
        "type": "string"
      },
      "userId": {
        "type": "string"
      }
    },
    "required": ["recordId"],
    "additionalProperties": false
  }, {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "default": "record-archive"
      },
      "recordId": {
        "type": "string"
      },
      "userId": {
        "type": "string"
      }
    },
    "required": ["recordId"],
    "additionalProperties": false
  }, {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "default": "record-restore"
      },
      "recordId": {
        "type": "string"
      },
      "userId": {
        "type": "string"
      }
    },
    "required": ["recordId"],
    "additionalProperties": false
  }, {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "default": "record-destroy"
      },
      "recordId": {
        "type": "string"
      },
      "userId": {
        "type": "string"
      }
    },
    "required": ["recordId"],
    "additionalProperties": false
  }, {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "default": "record-deprecate"
      },
      "recordId": {
        "type": "string"
      },
      "userId": {
        "type": "string"
      }
    },
    "required": ["recordId"],
    "additionalProperties": false
  }, {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "default": "record-reactivate"
      },
      "recordId": {
        "type": "string"
      },
      "userId": {
        "type": "string"
      }
    },
    "required": ["recordId"],
    "additionalProperties": false
  }, {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "default": "record-merge"
      },
      "recordIdOne": {
        "type": "string"
      },
      "recordIdTwo": {
        "type": "string"
      },
      "userId": {
        "type": "string"
      }
    },
    "required": ["recordIdOne", "recordIdTwo"],
    "additionalProperties": false
  }, {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "default": "record-unmerge"
      },
      "recordId": {
        "type": "string"
      },
      "userId": {
        "type": "string"
      }
    },
    "required": ["recordId"],
    "additionalProperties": false
  }, {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "default": "record-link"
      },
      "recordIdOne": {
        "type": "string"
      },
      "recordIdTwo": {
        "type": "string"
      },
      "userId": {
        "type": "string"
      }
    },
    "required": ["recordIdOne", "recordIdTwo"],
    "additionalProperties": false
  }, {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "default": "record-unlink"
      },
      "recordId": {
        "type": "string"
      },
      "userId": {
        "type": "string"
      }
    },
    "required": ["recordId"],
    "additionalProperties": false
  }, {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "default": "record-add-legal-hold"
      },
      "recordId": {
        "type": "string"
      },
      "userId": {
        "type": "string"
      }
    },
    "required": ["recordId"],
    "additionalProperties": false
  }, {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "default": "record-remove-legal-hold"
      },
      "recordId": {
        "type": "string"
      },
      "userId": {
        "type": "string"
      }
    },
    "required": ["recordId"],
    "additionalProperties": false
  }, {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "default": "record-manage-legal-hold"
      },
      "recordId": {
        "type": "string"
      },
      "userId": {
        "type": "string"
      }
    },
    "required": ["recordId"],
    "additionalProperties": false
  }
]
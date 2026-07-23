// /packages/checklist-manifesto/server/methods/protocols.js
//
// rpc-migration (Loop 1): checklist-protocol methods converted to
// Meteor.ServerMethods.define (global registry). Canonical names keep the
// pre-existing `checklist.protocols.*` namespace (collision-free vs core and
// vs the sibling checklist.lists.*/checklist.tasks.* files). Guards deleted in
// favor of requireAuth; check() -> schemaObject; this.userId -> context.userId.
// The internal Meteor.callAsync('checklist.lists.clone', ...) call site is left
// unchanged (Loop 2); lists.clone's positionalParams already cover it.

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { ChecklistLists } from '../../lib/collections/ChecklistLists';
import { ChecklistTasks } from '../../lib/collections/ChecklistTasks';

Meteor.ServerMethods.define('checklist.protocols.list', {
  description: 'List protocol templates visible to the caller (system, public, or owned)',
  // Historically guard-less by design: anonymous callers see system templates +
  // public protocols; the handler branches on context.userId for owned rows.
  requireAuth: false
}, async function(params, context){
  try {
    const protocols = await ChecklistLists.find({
      $or: [
        { isProtocol: true },
        { isSystemTemplate: true }
      ],
      isDeleted: { $ne: true }
    }, {
      fields: {
        title: 1,
        name: 1,
        description: 1,
        taskCount: 1,
        isSystemTemplate: 1,
        userId: 1,
        public: 1
      },
      sort: {
        isSystemTemplate: -1,  // System templates first
        title: 1
      }
    }).fetchAsync();

    // Filter based on user access
    if (context.userId) {
      // Logged in users see system templates, public protocols, and their own
      return protocols.filter(p =>
        p.isSystemTemplate ||
        p.public ||
        p.userId === context.userId
      );
    } else {
      // Anonymous users only see system templates and public protocols
      return protocols.filter(p =>
        p.isSystemTemplate ||
        p.public
      );
    }
  } catch (error) {
    throw new Meteor.Error('list-protocols-failed', 'Failed to list protocols');
  }
});

Meteor.ServerMethods.define('checklist.protocols.clone', {
  description: 'Clone a protocol template into a new working checklist list',
  positionalParams: ['protocolId'],
  schemaObject: {
    type: 'object',
    properties: { protocolId: { type: 'string' } },
    required: ['protocolId']
  }
}, async function(params, context){
  const protocolId = get(params, 'protocolId');

  try {
    // Use the existing clone method
    return await Meteor.callAsync('checklist.lists.clone', protocolId, {
      title: null // Will use default naming
    });
  } catch (error) {
    throw new Meteor.Error('clone-protocol-failed', get(error, 'reason', 'Failed to clone protocol'));
  }
});

Meteor.ServerMethods.define('checklist.protocols.create', {
  description: 'Convert an owned checklist list into a protocol snapshot',
  positionalParams: ['listId'],
  schemaObject: {
    type: 'object',
    properties: { listId: { type: 'string' } },
    required: ['listId']
  }
}, async function(params, context){
  const listId = get(params, 'listId');

  try {
    const list = await ChecklistLists.findOneAsync(listId);

    if (!list) {
      throw new Meteor.Error('not-found', 'List not found');
    }

    // Only the owner can make their list a protocol
    if (list.userId !== context.userId) {
      throw new Meteor.Error('not-authorized', 'You can only create protocols from your own lists');
    }

    // Convert to protocol
    const result = await ChecklistLists.updateAsync(
      { _id: listId },
      {
        $set: {
          isProtocol: true,
          mode: 'snapshot', // Protocols are snapshots
          lastModified: new Date()
        }
      }
    );

    return result;
  } catch (error) {
    throw new Meteor.Error('create-protocol-failed', 'Failed to create protocol');
  }
});

Meteor.ServerMethods.define('checklist.protocols.initializeSystemTemplates', {
  description: 'Seed or refresh the built-in system protocol templates',
  // Historically guard-less (invoked from Meteor.startup seeding). Kept public
  // so startup seeding continues to work without a user context.
  requireAuth: false
}, async function(params, context){
  // This method should only be called on the server
  if (!Meteor.isServer) {
    throw new Meteor.Error('server-only', 'This method can only be called on the server');
  }

  const templates = [
    {
      title: 'Collect Blood Specimen',
      description: 'Standard procedure for blood collection',
      tasks: [
        { description: 'Verify patient identity', priority: 'urgent' },
        { description: 'Check requisition form', priority: 'urgent' },
        { description: 'Gather supplies', priority: 'routine' },
        { description: 'Wash hands and wear gloves', priority: 'urgent' },
        { description: 'Apply tourniquet', priority: 'routine' },
        { description: 'Select venipuncture site', priority: 'routine' },
        { description: 'Clean site with antiseptic', priority: 'urgent' },
        { description: 'Perform venipuncture', priority: 'routine' },
        { description: 'Fill collection tubes in correct order', priority: 'urgent' },
        { description: 'Remove tourniquet', priority: 'routine' },
        { description: 'Remove needle and apply pressure', priority: 'routine' },
        { description: 'Label specimens', priority: 'urgent' },
        { description: 'Dispose of sharps properly', priority: 'urgent' },
        { description: 'Document procedure', priority: 'routine' }
      ]
    },
    {
      title: 'MRI Safety Checklist',
      description: 'Pre-MRI safety screening protocol',
      tasks: [
        { description: 'Verify patient identity', priority: 'urgent' },
        { description: 'Review contraindications checklist', priority: 'urgent' },
        { description: 'Check for implanted devices', priority: 'urgent' },
        { description: 'Screen for metallic objects', priority: 'urgent' },
        { description: 'Remove all jewelry and metal items', priority: 'urgent' },
        { description: 'Provide MRI-safe gown', priority: 'routine' },
        { description: 'Verify pregnancy status if applicable', priority: 'urgent' },
        { description: 'Assess for claustrophobia', priority: 'routine' },
        { description: 'Explain procedure to patient', priority: 'routine' },
        { description: 'Obtain informed consent', priority: 'urgent' },
        { description: 'Document screening completion', priority: 'routine' }
      ]
    },
    {
      title: 'Change Bed Linens',
      description: 'Standard procedure for changing hospital bed linens',
      tasks: [
        { description: 'Gather clean linens', priority: 'routine' },
        { description: 'Perform hand hygiene', priority: 'urgent' },
        { description: 'Explain procedure to patient', priority: 'routine' },
        { description: 'Provide privacy', priority: 'routine' },
        { description: 'Assist patient out of bed if able', priority: 'routine' },
        { description: 'Remove soiled linens', priority: 'routine' },
        { description: 'Clean mattress if needed', priority: 'routine' },
        { description: 'Apply clean bottom sheet', priority: 'routine' },
        { description: 'Apply clean top sheet and blanket', priority: 'routine' },
        { description: 'Change pillowcases', priority: 'routine' },
        { description: 'Dispose of soiled linens properly', priority: 'routine' },
        { description: 'Ensure patient comfort', priority: 'routine' },
        { description: 'Document linen change', priority: 'routine' }
      ]
    },
    {
      title: 'Incident Response Checklist',
      description: 'Initial response protocol for safety incidents',
      tasks: [
        { description: 'Ensure scene safety', priority: 'urgent' },
        { description: 'Assess immediate medical needs', priority: 'urgent' },
        { description: 'Call for assistance if needed', priority: 'urgent' },
        { description: 'Provide first aid if qualified', priority: 'urgent' },
        { description: 'Secure the area', priority: 'urgent' },
        { description: 'Identify witnesses', priority: 'routine' },
        { description: 'Document initial observations', priority: 'routine' },
        { description: 'Notify supervisor', priority: 'urgent' },
        { description: 'Complete incident report', priority: 'routine' },
        { description: 'Follow up with affected parties', priority: 'routine' }
      ]
    }
  ];

  let created = 0;
  let updated = 0;

  for (const template of templates) {
    try {
      // Check if template already exists
      const existing = await ChecklistLists.findOneAsync({
        title: template.title,
        isSystemTemplate: true
      });

      if (existing) {
        // Update existing template
        await ChecklistLists.updateAsync(
          { _id: existing._id },
          {
            $set: {
              description: template.description,
              lastModified: new Date()
            }
          }
        );
        updated++;
      } else {
        // Create new template
        const listId = await ChecklistLists.insertAsync({
          resourceType: 'List',
          status: 'active',
          mode: 'snapshot',
          title: template.title,
          name: template.title,
          description: template.description,
          incompleteCount: 0,
          taskCount: template.tasks.length,
          public: true,
          createdAt: new Date(),
          lastModified: new Date(),
          userId: null, // System templates have no owner
          isDeleted: false,
          isProtocol: true,
          isSystemTemplate: true
        });

        // Create tasks for the template
        for (let i = 0; i < template.tasks.length; i++) {
          const task = template.tasks[i];
          await ChecklistTasks.insertAsync({
            resourceType: 'Task',
            status: 'requested',
            description: task.description,
            priority: task.priority,
            authoredOn: new Date(),
            lastModified: new Date(),
            requester: null, // System tasks have no requester
            listId: listId,
            isDeleted: false,
            ordinal: i,
            isTemplate: true
          });
        }

        created++;
      }
    } catch (error) {
      console.error(`Error creating template "${template.title}":`, error);
    }
  }

  return { created, updated };
});

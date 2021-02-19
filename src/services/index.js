const tenants = require('./tenants/tenants.service.js');
const users = require('./users/users.service.js');
const queues = require('./queues/queues.service.js');
const extensions = require('./extensions/extensions.service.js');
const dids = require('./dids/dids.service.js');
const usersTenants = require('./users-tenants/users-tenants.service.js');
const tenantSettings = require('./tenant-settings/tenant-settings.service.js');
const parkinglots = require('./parkinglots/parkinglots.service.js');
const sipfriends = require('./sipfriends/sipfriends.service.js');
const voicemails = require('./voicemails/voicemails.service.js');
const voicemailMessages = require('./voicemail-messages/voicemail-messages.service.js');
const devices = require('./devices/devices.service.js');
const deviceModels = require('./device-models/device-models.service.js');
const autoprovisionValues = require('./autoprovision-values/autoprovision-values.service.js');
const phonePhonebooks = require('./phone-phonebooks/phone-phonebooks.service.js');
const phonebooks = require('./phonebooks/phonebooks.service.js');
const autoprovisionLabels = require('./autoprovision-labels/autoprovision-labels.service.js');
const destinations = require('./destinations/destinations.service.js');
const campaigns = require('./campaigns/campaigns.service.js');
const conditions = require('./conditions/conditions.service.js');
const conditionsExtended = require('./conditions-extended/conditions-extended.service.js');
const cronjobs = require('./cronjobs/cronjobs.service.js');
const customTypes = require('./custom-types/custom-types.service.js');
const customs = require('./customs/customs.service.js');
const features = require('./features/features.service.js');
const flows = require('./flows/flows.service.js');
const huntlists = require('./huntlists/huntlists.service.js');
const ivrs = require('./ivrs/ivrs.service.js');
const musiconholds = require('./musiconholds/musiconholds.service.js');
const pagingGroups = require('./paging-groups/paging-groups.service.js');
const disas = require('./disas/disas.service.js');
const queuemembers = require('./queuemembers/queuemembers.service.js');
const allowedQueueMembers = require('./queuemembers-allowed/queuemembers-allowed.service');
const meetmes = require('./meetmes/meetmes.service.js');
const specials = require('./specials/specials.service.js');
const mediafiles = require('./mediafiles/mediafiles.service.js');
const providers = require('./providers/providers.service.js');
const callBlocking = require('./call-blocking/call-blocking.service.js');
const conferenceBridges = require('./conference-bridges/conference-bridges.service.js');
const faxes = require('./faxes/faxes.service.js');
const phonebookLayouts = require('./phonebook-layouts/phonebook-layouts.service.js');
const routingProfiles = require('./routing-profiles/routing-profiles.service.js');
const dialingRules = require('./dialing-rules/dialing-rules.service.js');
const callReports = require('./call-reports/call-reports.service.js');
const locations = require('./locations/locations.service.js');
const tnOrdering = require('./tn-ordering/tn-ordering.service.js');
const numberPorting = require('./number-porting/number-porting.service.js');
const portInOrders = require('./port-in-orders/port-in-orders.service.js');
const inteliquentWebhooks = require('./inteliquent-webhooks/inteliquent-webhooks.service.js');
const asteriskNodes = require('./asterisk-nodes/asterisk-nodes.service.js');
const reporting = require('./reporting/reporting.service.js');
const checkNumber = require('./check-number/check-number.service.js');
const voxReports = require('./vox-reports/vox-reports.service.js');
const channelMemberships = require('./channel-memberships/channel-memberships.service.js');
const extensionStatus = require('./extension-status/extension-status.service.js');
const callDetailRecords = require('./call-detail-records/call-detail-records.service.js');
const bucketUploadHandler = require('./bucket-upload-handler/bucket-upload-handler.service.js');
const passwordReset = require('./password-reset/password-reset.service.js');
const voxoMeetCreds = require('./voxo-meet-creds/voxo-meet-creds.service.js');
const forgotPassword = require('./forgot-password/forgot-password.service.js');
const outboundFax = require('./outbound-fax/outbound-fax.service.js');
const phonebookDetails = require('./phonebook-details/phonebook-details.service');
const phonebookItems = require('./phonebook-items/phonebook-items.service');
const phonebookEntries = require('./phonebook-entries/phonebook-entries.service');
const callHistory = require('./call-history/call-history.service');
const sbcManagement = require('./sbc-management/sbc-management.service');
const queueLog = require('./queue-log/queue-log.service');
const queueStats = require('./queue-stats/queue-stats.service');
const mailToFaxes = require('./mail-to-faxes/mail-to-faxes.service');
const queueManagers = require('./queue-managers/queue-managers.service');
const natsActionsHandler = require('./nats-actions-handler/nats-actions-handler.service.js');
const jobs = require('./jobs/jobs.service.js');
const callgroups = require('./callgroups/callgroups.service.js');
const pickupgroups = require('./pickupgroups/pickupgroups.service.js');
const donotcalls = require('./donotcalls/donotcalls.service');

// eslint-disable-next-line no-unused-vars
module.exports = function (app) {
  app.configure(tenants);
  app.configure(users);
  app.configure(queues);
  app.configure(extensions);
  app.configure(dids);
  app.configure(usersTenants);
  app.configure(tenantSettings);
  app.configure(parkinglots);
  app.configure(sipfriends);
  app.configure(voicemails);
  app.configure(voicemailMessages);
  app.configure(devices);
  app.configure(deviceModels);
  app.configure(autoprovisionValues);
  app.configure(phonePhonebooks);
  app.configure(phonebooks);
  app.configure(autoprovisionLabels);
  app.configure(destinations);
  app.configure(campaigns);
  app.configure(conditions);
  app.configure(conditionsExtended);
  app.configure(cronjobs);
  app.configure(customTypes);
  app.configure(customs);
  app.configure(features);
  app.configure(flows);
  app.configure(huntlists);
  app.configure(ivrs);
  app.configure(musiconholds);
  app.configure(pagingGroups);
  app.configure(disas);
  app.configure(queuemembers);
  app.configure(allowedQueueMembers);
  app.configure(meetmes);
  app.configure(specials);
  app.configure(mediafiles);
  app.configure(providers);
  app.configure(callBlocking);
  app.configure(conferenceBridges);
  app.configure(faxes);
  app.configure(phonebookLayouts);
  app.configure(routingProfiles);
  app.configure(dialingRules);
  app.configure(callReports);
  app.configure(locations);
  app.configure(tnOrdering);
  app.configure(numberPorting);
  app.configure(portInOrders);
  app.configure(inteliquentWebhooks);
  app.configure(asteriskNodes);
  app.configure(reporting);
  app.configure(checkNumber);
  app.configure(voxReports);
  app.configure(channelMemberships);
  app.configure(extensionStatus);
  app.configure(callDetailRecords);
  app.configure(bucketUploadHandler);
  app.configure(passwordReset);
  app.configure(voxoMeetCreds);
  app.configure(forgotPassword);
  app.configure(outboundFax);
  app.configure(phonebookEntries);
  app.configure(phonebookDetails);
  app.configure(phonebookItems);
  app.configure(callHistory);
  app.configure(sbcManagement);
  app.configure(queueLog);
  app.configure(queueStats);
  app.configure(mailToFaxes);
  app.configure(queueManagers);
  app.configure(natsActionsHandler);
  app.configure(jobs);
  app.configure(callgroups);
  app.configure(pickupgroups);
  app.configure(donotcalls);
};

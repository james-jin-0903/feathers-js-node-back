const moment = require('moment');
const convertTime = require('../modules/convert-time');
const calendarBuild = require('calendar-js');

module.exports = async (params) => {

  const {totals, queueStats, queueAgentDetails} = params.queueData;

  //build calendar
  const month = moment().subtract('1', 'month').month();
  const year = moment().year();
  const calendarMonth = calendarBuild().of(year, month);
  const daysInMonth = calendarMonth.days;

  //need to flip the extName key to NameExt Key
  let nameExtKey = {};
  for(let agent in params.extNameKey){
    if(params.extNameKey.hasOwnProperty(agent)){
      nameExtKey[params.extNameKey[agent]] = agent;
    }
  }


  //build queueStats
  let queueStatsHTML = '';
  for(let queue in queueStats) {
    if (queueStats.hasOwnProperty(queue)) {
      const currentQueueGroup = queueStats[queue];

      //build out the agent details table for this queue.
      let queueAgentsHTML = '';
      let refusedTotal = 0;
      let queueInboundDuration = 0;
      for(let agent in queueAgentDetails[queue]){
        if(queueAgentDetails[queue].hasOwnProperty(agent)){
          const currentRow = queueAgentDetails [queue][agent];
          const memberName = nameExtKey[agent];
          refusedTotal += currentRow.refused;
          queueInboundDuration += currentRow.talkTime;
          queueAgentsHTML +=
            `
            <tr class="text-center" style="" align="center">
              <td class="text-blue text-left" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; color: #467fcf; padding: 4px 12px 4px 0;" align="left">${memberName}</td>
              <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 4px 12px;">${currentRow.totalInbound}</td>
              <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 4px 12px;">${currentRow.refused}</td>
              <td class="font-strong" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; font-weight: 600; padding: 4px 0 4px 12px;">${convertTime(currentRow.talkTime)}</td>
            </tr>
            `;
        }
      }

      let exitHTML = '';
      let timeoutHTML = '';
      let exitSummary = '';
      if(params.exitByKeyData.hasOwnProperty(queue)){
        for(let i = 0; i < params.exitByKeyData[queue].length; i++){
          exitHTML+=
            `
            <tr>
              <td class="text-left" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; color: #467fcf; padding: 2px 12px 2px 0; text-transform: capitalize;">
               ${params.exitByKeyData[queue][i].destination}
              </td>
              <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 2px 12px; font-size: 13px;">
                ${params.exitByKeyData[queue][i].count}
              </td>
            </tr>
          `;
        }
      }

      if(currentQueueGroup.exitsByTimeout > 0){
        timeoutHTML =
          `
            <tr>
              <td class="text-left" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; color: #467fcf; padding: 2px 12px 2px 0;">
                Timeout
              </td>
              <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 2px 12px; font-size: 13px;">
                ${currentQueueGroup.exitsByTimeout}
              </td>
            </tr>
          `;
      }

      if(exitHTML.length || timeoutHTML.length){
        exitSummary =
          `
          <h4 style="font-weight: 600; font-size: 14px; margin: 1em 0 .5em;">Queue Exit Details:</h4>
          <table class="row mt-lg" cellpadding="0" cellspacing="0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: 100%; table-layout: fixed; height: 100%;">
            <thead>
              <th class="text-left" style="text-transform: uppercase; font-weight: 600; color: #9eb0b7; font-size: 12px; padding: 0 0 4px;">Destination</th>
              <th style="text-transform: uppercase; font-weight: 600; color: #9eb0b7; font-size: 12px; padding: 0 0 4px;">Count</th>
            </thead>
            ${exitHTML}
            ${timeoutHTML}
          </table>
          `;
      }

      //build week blocks
      let weekData = {};
      for (let i = 0; i < calendarMonth.calendar.length; i++) {
        weekData[i + 1] = {
          days: calendarMonth.calendar[i],
          totalWaitTime: 0,
          totalAnswered: 0,
          totalAbandoned: 0
        };
      }

      //figure out most answered, abandoned, longest wait, shortest wait
      //first get all the totals for each week using calendar and statsDaily Data
      for(let week in weekData){
        if(weekData.hasOwnProperty(week)){
          for(let i = 0; i < weekData[week]['days'].length; i++){
            const dayIndex = weekData[week]['days'][i];
            if(dayIndex){
              weekData[week]['totalAnswered'] += currentQueueGroup.statsDaily[dayIndex].answeredCalls;
              weekData[week]['totalAbandoned'] += currentQueueGroup.statsDaily[dayIndex].abandonedCalls;
              weekData[week]['totalWaitTime'] += currentQueueGroup.statsDaily[dayIndex].totalWaitTime;
            }
          }
        }
      }
      //Next, loop back through totals for week by week and get our largest metrics.
      let longestWaitTime = 0;
      let shortestWaitTime = 0;
      let mostAnswered = 0;
      let mostAbandoned = 0;
      let shortestWeek = '';
      let longestWeek = '';
      let mostAbandonedWeek = '';
      let mostAnsweredWeek = '';
      let firstDay = '';
      let lastDay = '';
      for(let week in weekData){
        if(weekData.hasOwnProperty(week)){
          if(week == '1'){
            longestWaitTime = weekData[week]['totalWaitTime'];
            shortestWaitTime = weekData[week]['totalWaitTime'];
            mostAbandoned = weekData[week]['totalAbandoned'];
            mostAnswered = weekData[week]['totalAnswered'];
            firstDay = (month+1) + '/' + '1';
            lastDay = (month+1) + '/' + weekData[week]['days'][weekData[week]['days'].length-1];
            shortestWeek = firstDay + ' - ' + lastDay;
            longestWeek = firstDay + ' - ' + lastDay;
            mostAbandonedWeek = firstDay + ' - ' + lastDay;
            mostAnsweredWeek = firstDay + ' - ' + lastDay;
          } else{
            firstDay = (month+1) + '/' + weekData[week]['days'][0];
            lastDay = (month + 1) + '/' + Math.max(...weekData[week]['days']);
            if(weekData[week]['totalWaitTime'] > longestWaitTime){
              longestWaitTime = weekData[week]['totalWaitTime'];
              longestWeek = firstDay + ' - ' + lastDay;
            }
            if(weekData[week]['totalWaitTime'] < shortestWaitTime){
              shortestWaitTime = weekData[week]['totalWaitTime'];
              shortestWeek = firstDay + ' - ' + lastDay;
            }
            if(weekData[week]['totalAbandoned'] > mostAbandoned){
              mostAbandoned = weekData[week]['totalAbandoned'];
              mostAbandonedWeek = firstDay + ' - ' + lastDay;
            }
            if(weekData[week]['totalAnswered'] > mostAnswered){
              mostAnswered = weekData[week]['totalAnswered'];
              mostAnsweredWeek = firstDay + ' - ' + lastDay;
            }
          }
        }
      }

      queueStatsHTML +=
        `
        <tr>
          <td class="content" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 40px 48px;">
          <table class="row row-flex mb-md" cellspacing="0" cellpadding="0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: 100%; table-layout: auto; margin-bottom: 16px;">
          <tr>
            <td class="col text-mobile-center" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;" valign="top">
                <h4 class="m-0" style="font-weight: 600; font-size: 16px; margin: 0;">Monthly Incoming</h4>
                <div class="font-sm text-muted" style="color: #9eb0b7; font-size: 13px;">${currentQueueGroup.queueName}</div>
            </td>
            <td class="col-spacer col-spacer-sm" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; width: 16px;" valign="top"></td>
            <td class="col text-right font-sm text-mobile-center" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; font-size: 13px;" align="right" valign="top">
                <nobr><span class=""></span> Total: ${currentQueueGroup.totalIncoming + currentQueueGroup.totalAbandoned}</nobr>
                <nobr><span class=""></span> Answered: ${currentQueueGroup.totalIncoming}</nobr>
                <nobr><span class=""></span> Abandoned: ${currentQueueGroup.totalAbandoned}</nobr>
            </td>
          </tr>
          </table>
          <div class="pt-lg" style="padding-top: 24px;">
          <table class="row" cellspacing="0" cellpadding="0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: 100%; table-layout: fixed;">
          <tr>
              <td class="col" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;" valign="top">
                  <table class="table calendar calendar-md" cellspacing="0" cellpadding="0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: 100%; text-align: center; font-size: 14px; line-height: 100%;">
                      <tr>
                          <th style="text-transform: uppercase; font-weight: 600; color: #9eb0b7; font-size: 12px; padding: 0 0 4px;">S</th>
                          <th style="text-transform: uppercase; font-weight: 600; color: #9eb0b7; font-size: 12px; padding: 0 0 4px;">M</th>
                          <th style="text-transform: uppercase; font-weight: 600; color: #9eb0b7; font-size: 12px; padding: 0 0 4px;">T</th>
                          <th style="text-transform: uppercase; font-weight: 600; color: #9eb0b7; font-size: 12px; padding: 0 0 4px;">W</th>
                          <th style="text-transform: uppercase; font-weight: 600; color: #9eb0b7; font-size: 12px; padding: 0 0 4px;">T</th>
                          <th style="text-transform: uppercase; font-weight: 600; color: #9eb0b7; font-size: 12px; padding: 0 0 4px;">F</th>
                          <th style="text-transform: uppercase; font-weight: 600; color: #9eb0b7; font-size: 12px; padding: 0 0 4px;">S</th>
                      </tr>
                      ${buildCalendarHTML(weekData, currentQueueGroup)}
                  </table>
              </td>
              <td class="col-spacer" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; width: 24px;" valign="top"></td>
              <td class="col text-center va-middle" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;" align="center" valign="middle">
                <strong style="font-weight: 600;">Weekly Review</strong><br />
                <span class="font-sm text-muted" style="color: #9eb0b7; font-size: 13px;">Hover calendar to see total incoming calls for each day</span><br />
                  Most answered: <strong style="font-weight: 600;">${mostAnsweredWeek}</strong><br />
                  Most abandoned: <strong style="font-weight: 600;">${mostAbandonedWeek}</strong><br />
                  <br />
                  Longest Wait: <strong style="font-weight: 600;">${longestWeek}</strong><br />
                  Shortest Wait: <strong style="font-weight: 600;">${shortestWeek}</strong><br />
              </td>
          </tr>
          </table>
          </div>
          </td>
          </tr>
          <tr>
          <td class="content pt-0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 0 48px 40px;">
          <h4 class="mb-lg" style="font-weight: 600; font-size: 16px; margin: 0 0 24px;">Waiting Details</h4>
          <table class="row" cellspacing="0" cellpadding="0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: 100%; table-layout: fixed;">
          <tr>
          <td class="col text-center va-top" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;" align="center" valign="top">
              <table cellpadding="0" cellspacing="0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: 100%;">
                  <tr>
                      <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;">
                          <table class="w-auto" width="80" cellspacing="0" cellpadding="0" align="center" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: auto;">
                              <tr>
                                ${avgWaitDonut(currentQueueGroup)}
                              </tr>
                          </table>
                      </td>
                  </tr>
                  <tr>
                      <td class="pt-sm text-center" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding-top: 8px;" align="center">Avg Wait SLA</td>
                  </tr>
              </table>
          </td>
          <td class="col-hr" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; width: 1px !important; border-left-width: 16px; border-left-color: #fff; border-left-style: solid; border-right-width: 16px; border-right-color: #fff; border-right-style: solid;" bgcolor="#f0f0f0"></td>
          <td class="col text-center va-top" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;" align="center" valign="top">
              <table cellpadding="0" cellspacing="0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: 100%;">
                  <tr>
                      <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;">
                          <table class="w-auto" width="80" cellspacing="0" cellpadding="0" align="center" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: auto;">
                              <tr>
                                  ${callsOverTwoDonut(currentQueueGroup)}
                              </tr>
                          </table>
                      </td>
                  </tr>
                  <tr>
                      <td class="pt-sm text-center" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding-top: 8px;" align="center">Calls over 2m Wait</td>
                  </tr>
              </table>
          </td>
          <td class="col-hr" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; width: 1px !important; border-left-width: 16px; border-left-color: #fff; border-left-style: solid; border-right-width: 16px; border-right-color: #fff; border-right-style: solid;" bgcolor="#f0f0f0"></td>
          <td class="col text-center va-middle" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;" align="center" valign="middle">
              <table cellpadding="0" cellspacing="0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: 100%;">
                  <tr>
                    <td class="col text-center text-mobile-center va-middle" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;" align="center" valign="middle">
                        ${overTwoCompareTrend(currentQueueGroup)}
                    </td>
                  </tr>
              </table>
          </td>
          </tr>
          </table>
          </td>
        </tr>
        <tr>
          <td class="content border-bottom pt-0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-bottom-width: 1px; border-bottom-color: #f0f0f0; border-bottom-style: solid; padding: 0 48px 40px;">
          <h4 class="mb-lg" style="font-weight: 600; font-size: 16px; margin: 0 0 24px;">Performance Details</h4>
          <table class="row" cellspacing="0" cellpadding="0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: 100%; table-layout: fixed;">
          <tr>
          <td class="col text-center va-top" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;" align="center" valign="top">
              <table cellpadding="0" cellspacing="0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: 100%;">
                  <tr>
                      <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;">
                          <table class="w-auto" width="80" cellspacing="0" cellpadding="0" align="center" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: auto;">
                              <tr>
                                ${callsSLA(currentQueueGroup)}
                              </tr>
                          </table>
                      </td>
                  </tr>
                  <tr>
                      <td class="pt-sm text-center" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding-top: 8px;" align="center">Completed SLA (30s)</td>
                  </tr>
                  <tr>
                      <td class="pt-sm text-center" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding-top: 8px;" align="center">${((currentQueueGroup.completedSLA / currentQueueGroup.totalIncoming) * 100).toFixed(2)} %</td>
                  </tr>
              </table>
          </td>
          <td class="col-hr" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; width: 1px !important; border-left-width: 16px; border-left-color: #fff; border-left-style: solid; border-right-width: 16px; border-right-color: #fff; border-right-style: solid;" bgcolor="#f0f0f0"></td>
          <td class="col text-center va-top" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;" align="center" valign="top">
              <table cellpadding="0" cellspacing="0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: 100%;">
                  <tr>
                      <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;">
                          <table class="w-auto" width="80" cellspacing="0" cellpadding="0" align="center" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: auto;">
                              <tr>
                                  ${callsAbandoned(currentQueueGroup)}
                              </tr>
                          </table>
                      </td>
                  </tr>
                  <tr>
                      <td class="pt-sm text-center" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding-top: 8px;" align="center">Abandoned Calls</td>
                  </tr>
                  <tr>
                      <td class="pt-sm text-center" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding-top: 8px;" align="center">${(currentQueueGroup.totalAbandoned / daysInMonth).toFixed(2)} / day</td>
                  </tr>
              </table>
          </td>
          </tr>
          </table>
          ${exitSummary}
          </td>
        </tr>
        <tr>
            <td class="content pb-md" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 40px 48px 16px;">
                <h4 style="font-weight: 600; font-size: 16px; margin: 0 0 .5em;">Agent Details</h4>
                </td>
          </tr>
        <tr>
          <td class="content pt-0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 0 48px 40px;">
            <table class="table" cellspacing="0" cellpadding="0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: 100%;">
              <tr class="text-center" style="" align="center">
                  <th class="text-left" style="text-transform: uppercase; font-weight: 600; color: #9eb0b7; font-size: 12px; padding: 0 0 4px;" align="left">Agent</th>
                  <th style="text-transform: uppercase; font-weight: 600; color: #9eb0b7; font-size: 12px; padding: 0 0 4px;">Answered</th>
                  <th style="text-transform: uppercase; font-weight: 600; color: #9eb0b7; font-size: 12px; padding: 0 0 4px;">Refused</th>
                  <th class="text-right" style="text-transform: uppercase; font-weight: 600; color: #9eb0b7; font-size: 12px; padding: 0 0 4px;" align="right">Talk Time</th>
              </tr>
              ${queueAgentsHTML}
              <tr class="font-strong text-center text-red border-top" style="color: #cd201f; font-weight: 600; border-top-width: 1px; border-top-color: #f0f0f0; border-top-style: solid;" align="center">
                  <td class="text-left h4 text-default" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; font-weight: 600; font-size: 16px; color: #444444; margin: 0 0 .5em; padding: 4px 12px 4px 0;" align="left">Total</td>
                  <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 4px 12px;">${currentQueueGroup.totalIncoming}</td>
                  <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 4px 12px;">${refusedTotal}</td>
                  <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 4px 0 4px 12px;">${convertTime(queueInboundDuration)}</td>
              </tr>
            </table>
          </td>
          </tr>
        `;
    }
  }
  //1. build calendar block with statsDaily and totals, and calendarMonth
  //2. build weekly review
  //3. finish donut and wait comparison

  //time to build agent details for calls and pauses
  let agentSummary = [];
  let agentAnsweredTotal = 0;
  let agentOutboundTotal = 0;
  let agentTotalCalls = 0;
  let agentTotalDuration = 0;

  for (let agent in params.extNameKey) {
    if (params.extNameKey.hasOwnProperty(agent)) {
      const agentName = agent.replace(/_/g, ' ');

      let agentObject = {
        name: agentName,
        answered: 0,
        outbound: 0,
        duration: 0,
        totalPauseTime: 0,
        pauses: {
          'Break': 0,
          'Lunch': 0,
          'Account Review': 0,
          'Meeting': 0,
          'Personal': 0,
          'Other': 0
        }
      };

      if (params.incoming.hasOwnProperty(params.extNameKey[agent])) {
        const extNumberIncoming = params.extNameKey[agent];

        for (let i = 0; i < params.incoming[extNumberIncoming].length; i++) {
          agentObject['answered']++;
          agentObject['duration'] += parseInt(params.incoming[extNumberIncoming][i].data2);
          agentAnsweredTotal++;
          agentTotalCalls++;
          agentTotalDuration += parseInt(params.incoming[extNumberIncoming][i].data2);
        }
      }

      if (params.outgoing.hasOwnProperty(params.extNameKey[agent])) {
        const extNumberOutgoing = params.extNameKey[agent];

        for (let i = 0; i < params.outgoing[extNumberOutgoing].length; i++) {
          agentObject['outbound'] += parseInt(params.outgoing[extNumberOutgoing][i].totalCalls);
          agentObject['duration'] += parseInt(params.outgoing[extNumberOutgoing][i].minutesOut) * 60;
          agentOutboundTotal += parseInt(params.outgoing[extNumberOutgoing][i].totalCalls);
          agentTotalCalls += parseInt(params.outgoing[extNumberOutgoing][i].totalCalls);
          agentTotalDuration += parseInt(params.outgoing[extNumberOutgoing][i].minutesOut) * 60;
        }
      }

      if (params.pauses.hasOwnProperty(params.extNameKey[agent])) {
        const extNumberPauses = params.extNameKey[agent];

        for (let i = 0; i < params.pauses[extNumberPauses].length; i++) {
          const currentPauseGroup = params.pauses[extNumberPauses][i];
          const groupReason = currentPauseGroup['reason'];
          if (agentObject.pauses.hasOwnProperty(groupReason)) {
            agentObject.pauses[groupReason] += parseInt(currentPauseGroup['length']);
            agentObject.totalPauseTime += parseInt(currentPauseGroup['length']);
          } else {
            agentObject.pauses['Other'] += parseInt(currentPauseGroup['length']);
            agentObject.totalPauseTime += parseInt(currentPauseGroup['length']);
          }
        }
      }

      agentSummary.push(agentObject);
    }
  }

  let pauseHTML = '';
  let agentHTML = '';
  let pauseTotals = {
    'Break': 0,
    'Lunch': 0,
    'Account Review': 0,
    'Meeting': 0,
    'Personal': 0,
    'Other': 0
  };
  for (let i = 0; i < agentSummary.length; i++) {

    if (agentSummary[i].answered + agentSummary[i].outbound > 0) {
      agentHTML +=
        `
      <tr class="text-center" style="" align="center">
        <td class="text-blue text-left" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; color: #467fcf; padding: 4px 12px 4px 0;" align="left">${agentSummary[i].name}</td>
        <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 4px 12px;">${agentSummary[i].answered}</td>
<!--        <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 4px 12px;">??</td>-->
        <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 4px 12px;">${agentSummary[i].outbound}</td>
        <td class="font-strong" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; font-weight: 600; padding: 4px 12px;">${agentSummary[i].answered + agentSummary[i].outbound}</td>
        <td class="font-strong" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; font-weight: 600; padding: 4px 0 4px 12px;">${convertTime(agentSummary[i].duration)}</td>
      </tr>
      `;
    }

    if (agentSummary[i].totalPauseTime > 0) {
      pauseHTML +=
        `
        <tr class="text-center" style="" align="center">
          <td class="text-blue text-left" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; color: #467fcf; padding: 4px 12px 4px 0;" align="left">${agentSummary[i].name}</td>
          <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 4px 12px;">${convertTime(agentSummary[i].pauses['Break'])}</td>
          <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 4px 12px;">${convertTime(agentSummary[i].pauses['Lunch'])}</td>
          <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 4px 12px;">${convertTime(agentSummary[i].pauses['Account Review'])}</td>
          <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 4px 12px;">${convertTime(agentSummary[i].pauses['Meeting'])}</td>
          <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 4px 12px;">${convertTime(agentSummary[i].pauses['Personal'])}</td>
          <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 4px 0 4px 12px;">${convertTime(agentSummary[i].pauses['Other'])}</td>
      </tr>
      `;
    }

    pauseTotals['Break'] += agentSummary[i].pauses['Break'];
    pauseTotals['Lunch'] += agentSummary[i].pauses['Lunch'];
    pauseTotals['Account Review'] += agentSummary[i].pauses['Account Review'];
    pauseTotals['Meeting'] += agentSummary[i].pauses['Meeting'];
    pauseTotals['Personal'] += agentSummary[i].pauses['Personal'];
    pauseTotals['Other'] += agentSummary[i].pauses['Other'];
  }


  const html =
    `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns="http://www.w3.org/1999/xhtml">

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta content="telephone=no" name="format-detection" />
    <title></title>
    <style type="text/css" data-premailer="ignore">
        @import url(https://fonts.googleapis.com/css?family=Open+Sans:300,400,500,600,700);
    </style>
    <style data-premailer="ignore">
        @media screen and (max-width: 600px) {
            u+.body {
                width: 100vw !important;
            }
        }
        a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: none !important;
            font-size: inherit !important;
            font-family: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important;
        }
    </style>
    <!--[if mso]>
      <style type="text/css">
        body, table, td {
        font-family: Arial, Helvetica, sans-serif !important;
        }
        img {
        -ms-interpolation-mode: bicubic;
        }
        .box {
        border-color: #eee !important;
        }
      </style>
    <![endif]-->

<style>body {
margin: 0; padding: 0; background-color: #f5f7fb; font-size: 15px; line-height: 160%; mso-line-height-rule: exactly; color: #444444; width: 100%;
}
body {
font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;
}
img {
border: 0 none; line-height: 100%; outline: none; text-decoration: none; vertical-align: baseline; font-size: 0;
}
a:hover {
text-decoration: underline;
}
.btn:hover {
text-decoration: none;
}
.btn.bg-bordered:hover {
background-color: #f9fbfe !important;
}
a.bg-blue:hover {
background-color: #3a77cc !important;
}
a.bg-azure:hover {
background-color: #37a3f1 !important;
}
a.bg-indigo:hover {
background-color: #596ac9 !important;
}
a.bg-purple:hover {
background-color: #9d50e8 !important;
}
a.bg-pink:hover {
background-color: #f55f91 !important;
}
a.bg-red:hover {
background-color: #c01e1d !important;
}
a.bg-orange:hover {
background-color: #fd8e35 !important;
}
a.bg-yellow:hover {
background-color: #e3b90d !important;
}
a.bg-lime:hover {
background-color: #73cb2d !important;
}
a.bg-green:hover {
background-color: #56ab00 !important;
}
a.bg-teal:hover {
background-color: #28beae !important;
}
a.bg-cyan:hover {
background-color: #1596aa !important;
}
a.bg-gray:hover {
background-color: #95a9b0 !important;
}
a.bg-secondary:hover {
background-color: #ecf0f2 !important;
}
.img-hover:hover img {
opacity: .64;
}
@media only screen and (max-width: 560px) {
  body {
    font-size: 14px !important;
  }
  .content {
    padding: 24px !important;
  }
  .content-image-text {
    padding: 24px !important;
  }
  .content-image {
    height: 100px !important;
  }
  .content-image-text {
    padding-top: 96px !important;
  }
  h1 {
    font-size: 24px !important;
  }
  .h1 {
    font-size: 24px !important;
  }
  h2 {
    font-size: 20px !important;
  }
  .h2 {
    font-size: 20px !important;
  }
  h3 {
    font-size: 18px !important;
  }
  .h3 {
    font-size: 18px !important;
  }
  .col {
    display: table !important; width: 100% !important;
  }
  .col-spacer {
    display: table !important; width: 100% !important;
  }
  .col-spacer-xs {
    display: table !important; width: 100% !important;
  }
  .col-spacer-sm {
    display: table !important; width: 100% !important;
  }
  .col-hr {
    display: table !important; width: 100% !important;
  }
  .row {
    display: table !important; width: 100% !important;
  }
  .col-hr {
    border: 0 !important; height: 24px !important; width: auto !important; background: transparent !important;
  }
  .col-spacer {
    width: 100% !important; height: 24px !important;
  }
  .col-spacer-sm {
    height: 16px !important;
  }
  .col-spacer-xs {
    height: 8px !important;
  }
  .chart-cell-spacer {
    width: 4px !important;
  }
  .text-mobile-center {
    text-align: center !important;
  }
  .d-mobile-none {
    display: none !important;
  }
}
</style></head>

<body class="bg-body" style="font-size: 15px; margin: 0; padding: 0; line-height: 160%; mso-line-height-rule: exactly; color: #444444; width: 100%; font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;" bgcolor="#f5f7fb">
    <center>
        <table class="main bg-body" width="100%" cellspacing="0" cellpadding="0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: 100%; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;" bgcolor="#f5f7fb">
            <tr>
                <td align="center" valign="top" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;">
                    <!--[if (gte mso 9)|(IE)]>
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" valign="top" width="640">
            <![endif]-->
                    <span class="preheader" style="font-size: 0; padding: 0; display: none; max-height: 0; mso-hide: all; line-height: 0; color: transparent; height: 0; max-width: 0; opacity: 0; overflow: hidden; visibility: hidden; width: 0;">Your VOXO manager monthly call report</span>
                    <table class="wrap" cellspacing="0" cellpadding="0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: 100%; max-width: 640px; text-align: left;">
                        <tr>
                            <td class="p-sm" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 8px;">
                                <table cellpadding="0" cellspacing="0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: 100%;">
                                    <tr>
                                        <td class="py-lg" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding-top: 24px; padding-bottom: 24px;">
                                            <table cellspacing="0" cellpadding="0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: 100%;">
                                                <tr>
                                                    <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;">
                                                        <a href="#" style="color: #467fcf; text-decoration: none;"><img src="https://s3.amazonaws.com/miscdts/voxo-assets/email/images/icons/voxo-logo.png" width="116" height="21" alt="" style="line-height: 100%; outline: none; text-decoration: none; vertical-align: baseline; font-size: 0; border: 0 none;" /></a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                                <div class="main-content">
                                    <table class="box" cellpadding="0" cellspacing="0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: 100%; border-radius: 3px; -webkit-box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05); box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05); border: 1px solid #f0f0f0;" bgcolor="#ffffff">
                                        <tr>
                                            <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;">
                                                <table cellpadding="0" cellspacing="0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: 100%;">
                                                  <td class="content pb-0" align="center" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 40px 48px 0;">
                                                      <table class="icon icon-lg bg-green-lightest " cellspacing="0" cellpadding="0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 0; border-collapse: separate; width: 72px; border-radius: 50%; line-height: 100%; font-weight: 300; height: 72px; font-size: 48px; text-align: center;" bgcolor="#eff8e6">
                                                          <tr>
                                                              <td valign="middle" align="center" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;">
                                                                  <img src="https://s3.amazonaws.com/miscdts/voxo-assets/email/images/icons/green/pie-chart.png" class=" va-middle" width="40" height="40" alt="check" style="line-height: 100%; border: 0 none; outline: none; text-decoration: none; vertical-align: middle; font-size: 0; display: block; width: 40px; height: 40px;" />
                                                              </td>
                                                          </tr>
                                                      </table>
                                                  </td>
                                                    <tr>
                                                        <td class="content pb-0" align="center" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 40px 48px 0;">
                                                            <h1 class="text-center m-0" style="font-weight: 300; font-size: 28px; line-height: 130%; margin: 0;" align="center">Monthly Manager Summary</h1>
                                                            <p class="text-center mt-sm mb-0 text-muted" style="color: #9eb0b7; margin: 8px 0 0;" align="center">${moment().subtract('1', 'month').format('MMMM') + ' ' + moment().subtract('1', 'month').format('YYYY')}</p>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td class="content pt-0 border-bottom" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-bottom-width: 1px; border-bottom-color: #f0f0f0; border-bottom-style: solid; padding: 0 48px 40px;">
                                                            <table class="row mt-xl" cellpadding="0" cellspacing="0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: 100%; table-layout: fixed; margin-top: 48px;">
                                                                <tr>
                                                                    <td class="col text-center" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;" align="center" valign="top">
                                                                        <table class="row" cellpadding="0" cellspacing="0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: 100%; table-layout: fixed; height: 100%;">
                                                                            <tr>
                                                                                <td class="col-mobile text-center" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;" align="center" valign="top">
                                                                                    <img src="https://s3.amazonaws.com/miscdts/voxo-assets/email/images/icons/blue/phone-outgoing.png" class=" va-middle" width="24" height="24" alt="map-pin" style="line-height: 100%; outline: none; text-decoration: none; vertical-align: middle; font-size: 0; border: 0 none;" />
                                                                                    <div class="mt-xs" style="margin-top: 4px;">${totals.outboundCalls}</div>
                                                                                    <div class="font-sm text-muted" style="color: #9eb0b7; font-size: 13px;">Outgoing</div>
                                                                                </td>
                                                                                <td class="col-mobile-spacer" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; width: 24px;"></td>
                                                                                <td class="col-mobile text-center" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;" align="center" valign="top">
                                                                                    <img src="https://s3.amazonaws.com/miscdts/voxo-assets/email/images/icons/green/phone-incoming.png" class=" va-middle" width="24" height="24" alt="clock" style="line-height: 100%; outline: none; text-decoration: none; vertical-align: middle; font-size: 0; border: 0 none;" />
                                                                                    <div class="mt-xs" style="margin-top: 4px;">${totals.answeredCalls + totals.totalAbandoned}</div>
                                                                                    <div class="font-sm text-muted" style="color: #9eb0b7; font-size: 13px;">Incoming (Queue)</div>
                                                                                </td>
                                                                                <td class="col-mobile-spacer" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; width: 24px;"></td>
                                                                                <td class="col-mobile text-center" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;" align="center" valign="top">
                                                                                    <img src="https://s3.amazonaws.com/miscdts/voxo-assets/email/images/icons/green/phone-incoming.png" class=" va-middle" width="24" height="24" alt="clock" style="line-height: 100%; outline: none; text-decoration: none; vertical-align: middle; font-size: 0; border: 0 none;" />
                                                                                    <div class="mt-xs" style="margin-top: 4px;">${totals.agentCalls}</div>
                                                                                    <div class="font-sm text-muted" style="color: #9eb0b7; font-size: 13px;">Incoming (Agent)</div>
                                                                                </td>
                                                                            </tr>
                                                                        </table>
                                                                    </td>
                                                                    <td class="col-spacer" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; width: 24px;" valign="top"></td>
                                                                    <td class="col text-center" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;" align="center" valign="top">
                                                                        <table class="row" cellpadding="0" cellspacing="0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: 100%; table-layout: fixed; height: 100%;">
                                                                            <tr>
                                                                                <td class="col-mobile text-center" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;" align="center" valign="top">
                                                                                    <img src="https://s3.amazonaws.com/miscdts/voxo-assets/email/images/icons/gray/clock.png" class=" va-middle" width="24" height="24" alt="trending-up" style="line-height: 100%; outline: none; text-decoration: none; vertical-align: middle; font-size: 0; border: 0 none;" />
                                                                                    <div class="mt-xs" style="margin-top: 4px;">${convertTime((totals.talkTime / (totals.answeredCalls + totals.outboundCalls)))}</div>
                                                                                    <div class="font-sm text-muted" style="color: #9eb0b7; font-size: 13px;">Avg Duration</div>
                                                                                </td>
                                                                                <td class="col-mobile-spacer" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; width: 24px;"></td>
                                                                                <td class="col-mobile text-center" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;" align="center" valign="top">
                                                                                    <img src="https://s3.amazonaws.com/miscdts/voxo-assets/email/images/icons/yellow/clock.png" class=" va-middle" width="24" height="24" alt="thumbs-up" style="line-height: 100%; outline: none; text-decoration: none; vertical-align: middle; font-size: 0; border: 0 none;" />
                                                                                    <div class="mt-xs" style="margin-top: 4px;">${convertTime(totals.talkTime)}</div>
                                                                                    <div class="font-sm text-muted" style="color: #9eb0b7; font-size: 13px;">Total Talk Time</div>
                                                                                </td>
                                                                            </tr>
                                                                        </table>
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                    ${queueStatsHTML}
                                                    <tr>
                                                        <td class="content pb-md" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 40px 48px 16px;">
                                                            <h4 style="font-weight: 600; font-size: 16px; margin: 0 0 .5em;">Overall Agent Details</h4>
                                                            </td></tr><tr>
                                                                <td class="content pt-0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 0 48px 40px;">
                                                                    <table class="table" cellspacing="0" cellpadding="0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: 100%;">
                                                                        <tr class="text-center" style="" align="center">
                                                                            <th class="text-left" style="text-transform: uppercase; font-weight: 600; color: #9eb0b7; font-size: 12px; padding: 0 0 4px;" align="left">Agent</th>
                                                                            <th style="text-transform: uppercase; font-weight: 600; color: #9eb0b7; font-size: 12px; padding: 0 0 4px;">Answered</th>
                                                                            <th style="text-transform: uppercase; font-weight: 600; color: #9eb0b7; font-size: 12px; padding: 0 0 4px;">Outbound</th>
                                                                            <th style="text-transform: uppercase; font-weight: 600; color: #9eb0b7; font-size: 12px; padding: 0 0 4px;">Total Calls</th>
                                                                            <th class="text-right" style="text-transform: uppercase; font-weight: 600; color: #9eb0b7; font-size: 12px; padding: 0 0 4px;" align="right">Total Dur</th>
                                                                        </tr>
                                                                        ${agentHTML}
                                                                        <tr class="font-strong text-center text-red border-top" style="color: #cd201f; font-weight: 600; border-top-width: 1px; border-top-color: #f0f0f0; border-top-style: solid;" align="center">
                                                                            <td class="text-left h4 text-default" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; font-weight: 600; font-size: 16px; color: #444444; margin: 0 0 .5em; padding: 4px 12px 4px 0;" align="left">Total</td>
                                                                            <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 4px 12px;">${agentAnsweredTotal}</td>
                                                                            <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 4px 12px;">${agentOutboundTotal}</td>
                                                                            <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 4px 12px;">${agentTotalCalls}</td>
                                                                            <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 4px 0 4px 12px;">${convertTime(agentTotalDuration)}</td>
                                                                        </tr>
                                                                    </table>
                                                                </td>
                                                            </tr>


                                                    <tr class="border-top" style="border-top-width: 1px; border-top-color: #f0f0f0; border-top-style: solid;">
                                                        <td class="content pb-md" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 40px 48px 16px;">
                                                            <h4 style="font-weight: 600; font-size: 16px; margin: 0 0 .5em;">Pause Details</h4>
                                                            </td></tr><tr>
                                                                <td class="content pt-0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 0 48px 40px;">
                                                                    <table class="table" cellspacing="0" cellpadding="0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: 100%;">
                                                                        <tr class="text-center" style="" align="center">
                                                                            <th class="text-left" style="text-transform: uppercase; font-weight: 600; color: #9eb0b7; font-size: 12px; padding: 0 0 4px;" align="left">Agent</th>
                                                                            <th style="text-transform: uppercase; font-weight: 600; color: #9eb0b7; font-size: 12px; padding: 0 0 4px;"><img src="https://miscdts.s3.amazonaws.com/voxo-assets/email/images/icons/break.png" width="20" height="25" alt="" style="line-height: 100%; outline: none; text-decoration: none; vertical-align: baseline; font-size: 0; border: 0 none;" /></th>
                                                                            <th style="text-transform: uppercase; font-weight: 600; color: #9eb0b7; font-size: 12px; padding: 0 0 4px;"><img src="https://miscdts.s3.amazonaws.com/voxo-assets/email/images/icons/lunch.png" width="20" height="25" alt="" style="line-height: 100%; outline: none; text-decoration: none; vertical-align: baseline; font-size: 0; border: 0 none;" /></th>
                                                                            <th style="text-transform: uppercase; font-weight: 600; color: #9eb0b7; font-size: 12px; padding: 0 0 4px;"><img src="https://miscdts.s3.amazonaws.com/voxo-assets/email/images/icons/accountreview.png" width="20" height="25" alt="" style="line-height: 100%; outline: none; text-decoration: none; vertical-align: baseline; font-size: 0; border: 0 none;" /></th>
                                                                            <th style="text-transform: uppercase; font-weight: 600; color: #9eb0b7; font-size: 12px; padding: 0 0 4px;"><img src="https://miscdts.s3.amazonaws.com/voxo-assets/email/images/icons/meeting.png" width="20" height="25" alt="" style="line-height: 100%; outline: none; text-decoration: none; vertical-align: baseline; font-size: 0; border: 0 none;" /></th>
                                                                            <th style="text-transform: uppercase; font-weight: 600; color: #9eb0b7; font-size: 12px; padding: 0 0 4px;"><img src="https://miscdts.s3.amazonaws.com/voxo-assets/email/images/icons/personal.png" width="20" height="25" alt="" style="line-height: 100%; outline: none; text-decoration: none; vertical-align: baseline; font-size: 0; border: 0 none;" /></th>
                                                                            <th style="text-transform: uppercase; font-weight: 600; color: #9eb0b7; font-size: 12px; padding: 0 0 4px;"><img src="https://miscdts.s3.amazonaws.com/voxo-assets/email/images/icons/other.png" width="20" height="25" alt="" style="line-height: 100%; outline: none; text-decoration: none; vertical-align: baseline; font-size: 0; border: 0 none;" /></th>
                                                                        </tr>
                                                                        ${pauseHTML}
                                                                        <tr class="font-strong text-center text-red border-top" style="color: #cd201f; font-weight: 600; border-top-width: 1px; border-top-color: #f0f0f0; border-top-style: solid;" align="center">
                                                                            <td class="text-left h4 text-default" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; font-weight: 600; font-size: 16px; color: #444444; margin: 0 0 .5em; padding: 4px 12px 4px 0;" align="left">Total</td>
                                                                            <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 4px 12px;">${convertTime(pauseTotals['Break'])}</td>
                                                                            <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 4px 12px;">${convertTime(pauseTotals['Lunch'])}</td>
                                                                            <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 4px 12px;">${convertTime(pauseTotals['Account Review'])}</td>
                                                                            <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 4px 12px;">${convertTime(pauseTotals['Meeting'])}</td>
                                                                            <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 4px 12px;">${convertTime(pauseTotals['Personal'])}</td>
                                                                            <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 4px 0 4px 12px;">${convertTime(pauseTotals['Other'])}</td>
                                                                        </tr>
                                                                    </table>
                                                                </td>
                                                            </tr>

                                                        <td class="content pt-0 pb-0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 0 48px;">
                                                            <table class="row" cellspacing="0" cellpadding="0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: 100%; table-layout: fixed;">
                                                                <tr>
                                                                    <td class="col" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;" valign="top">
                                                                        <table cellspacing="0" cellpadding="0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: 100%;">
                                                                            <tr>
                                                                                <td class="rounded p-lg bg-light" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-radius: 3px; padding: 24px;" bgcolor="#fafafa">
                                                                                    <h4 style="font-weight: 600; font-size: 16px; margin: 0 0 .5em;">Legend</h4>
                                                                                    <p class="font-sm mb-0" style="font-size: 13px; margin: 0;">
                                                                                        <img src="https://miscdts.s3.amazonaws.com/voxo-assets/email/images/icons/break.png" width="17" height="21.25" alt="" style="line-height: 100%; outline: none; text-decoration: none; vertical-align: baseline; font-size: 0; border: 0 none;" /> = Break<br />
                                                                                        <img src="https://miscdts.s3.amazonaws.com/voxo-assets/email/images/icons/lunch.png" width="17" height="21.25" alt="" style="line-height: 100%; outline: none; text-decoration: none; vertical-align: baseline; font-size: 0; border: 0 none;" /> = Lunch<br />
                                                                                        <img src="https://s3.amazonaws.com/miscdts/voxo-assets/email/images/icons/accountreview.png" width="17" height="21.25" alt="" style="line-height: 100%; outline: none; text-decoration: none; vertical-align: baseline; font-size: 0; border: 0 none;" /> = Account Review<br />
                                                                                        <img src="https://s3.amazonaws.com/miscdts/voxo-assets/email/images/icons/meeting.png" width="17" height="21.25" alt="" style="line-height: 100%; outline: none; text-decoration: none; vertical-align: baseline; font-size: 0; border: 0 none;" /> = Meeting<br />
                                                                                        <img src="https://s3.amazonaws.com/miscdts/voxo-assets/email/images/icons/personal.png" width="17" height="21.25" alt="" style="line-height: 100%; outline: none; text-decoration: none; vertical-align: baseline; font-size: 0; border: 0 none;" /> = Personal<br />
                                                                                        <img src="https://s3.amazonaws.com/miscdts/voxo-assets/email/images/icons/other.png" width="17" height="21.25" alt="" style="line-height: 100%; outline: none; text-decoration: none; vertical-align: baseline; font-size: 0; border: 0 none;" /> = Other<br />
                                                                                    </p>
                                                                                </td>
                                                                            </tr>
                                                                        </table>
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                        </td>

                                                    <tr>
                                                        <td class="pb-0 content" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 40px 48px 0;">
                                                            <p style="margin: 0 0 1em;">If you are looking for more detailed reporting on a per user or per call queue basis, please click below to login to the portal.</p>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td class="content" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 40px 48px;">
                                                            <table cellspacing="0" cellpadding="0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: 100%;">
                                                                <tr>
                                                                    <td align="center" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif;">
                                                                        <table cellpadding="0" cellspacing="0" border="0" class="bg-blue rounded w-auto" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: separate; width: auto; color: #ffffff; border-radius: 3px;" bgcolor="#467fcf">
                                                                            <tr>
                                                                                <td align="center" valign="top" class="lh-1" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; line-height: 100%;">
                                                                                    <a href="https://portal.voxo.co" class="btn bg-blue border-blue" style="color: #ffffff; padding: 12px 32px; border: 1px solid #467fcf; text-decoration: none; white-space: nowrap; font-weight: 600; font-size: 16px; border-radius: 3px; line-height: 100%; display: block; -webkit-transition: .3s background-color; transition: .3s background-color; background-color: #467fcf;">
                                                                                        <span class="btn-span" style="color: #ffffff; font-size: 16px; text-decoration: none; white-space: nowrap; font-weight: 600; line-height: 100%;">Login Now</span>
                                                                                    </a>
                                                                                </td>
                                                                            </tr>
                                                                        </table>
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                                <table cellspacing="0" cellpadding="0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: 100%;">
                                    <tr>
                                        <td class="py-xl" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding-top: 48px; padding-bottom: 48px;">
                                            <table class="font-sm text-center text-muted" cellspacing="0" cellpadding="0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: 100%; color: #9eb0b7; text-align: center; font-size: 13px;">
                                                <tr>
                                                    <td align="center" class="pb-md" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding-bottom: 16px;">
                                                        <table class="w-auto" cellspacing="0" cellpadding="0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: collapse; width: auto;">
                                                            <tr>
                                                                <td class="px-sm" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding-right: 8px; padding-left: 8px;">
                                                                    <a href="https://www.facebook.com/voxoco" style="color: #467fcf; text-decoration: none;">
                                                                        <img src="https://s3.amazonaws.com/miscdts/voxo-assets/email/images/icons/facebook-square.png" class=" va-middle" width="24" height="24" alt="social-facebook-square" style="line-height: 100%; outline: none; text-decoration: none; vertical-align: middle; font-size: 0; border: 0 none;" />
                                                                    </a>
                                                                </td>
                                                                <td class="px-sm" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding-right: 8px; padding-left: 8px;">
                                                                    <a href="https://twitter.com/voxollc" style="color: #467fcf; text-decoration: none;">
                                                                        <img src="https://s3.amazonaws.com/miscdts/voxo-assets/email/images/icons/twitter.png" class=" va-middle" width="24" height="24" alt="social-twitter" style="line-height: 100%; outline: none; text-decoration: none; vertical-align: middle; font-size: 0; border: 0 none;" />
                                                                    </a>
                                                                </td>
                                                                <td class="px-sm" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding-right: 8px; padding-left: 8px;">
                                                                    <a href="https://github.com/voxoco" style="color: #467fcf; text-decoration: none;">
                                                                        <img src="https://s3.amazonaws.com/miscdts/voxo-assets/email/images/icons/github.png" class=" va-middle" width="24" height="24" alt="social-github" style="line-height: 100%; outline: none; text-decoration: none; vertical-align: middle; font-size: 0; border: 0 none;" />
                                                                    </a>
                                                                </td>
                                                                <td class="px-sm" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding-right: 8px; padding-left: 8px;">
                                                                    <a href="https://www.youtube.com/channel/UCd4HH8LtYnHVYcT56XLVWwQ" style="color: #467fcf; text-decoration: none;">
                                                                        <img src="https://s3.amazonaws.com/miscdts/voxo-assets/email/images/icons/youtube.png" class=" va-middle" width="24" height="24" alt="social-youtube" style="line-height: 100%; outline: none; text-decoration: none; vertical-align: middle; font-size: 0; border: 0 none;" />
                                                                    </a>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td class="px-lg" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding-right: 24px; padding-left: 24px;">
                                                        If you have any questions, feel free to message us at <a href="mailto:support@voxo.co" class="text-muted" style="color: #9eb0b7; text-decoration: none;">support@voxo.co</a>.
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                    <!--[if (gte mso 9)|(IE)]>
            </td>
          </tr>
        </table>
            <![endif]-->
                </td>
            </tr>
        </table>
    </center>
</body>

</html>
    `;

  return html;
};

function buildCalendarHTML(weekData, data){

  let calendarData = '';
  let queueTotalCalls = data.totalIncoming + data.totalAbandoned;
  for(let week in weekData){
    if(weekData.hasOwnProperty(week)){

      calendarData +=
        `
        <tr>
        `;

      for(let i = 0; i < weekData[week]['days'].length; i++){
        const currentDay = weekData[week]['days'][i];
        let totalCalls = 0;
        let bgColor = 'rgba(255,255,255, 0)';
        if(currentDay > 0){
          totalCalls = data.statsDaily[currentDay]['totalCalls'];
          const callPerc = (totalCalls / queueTotalCalls).toFixed(2);
          if(totalCalls > 0 ){
            bgColor = `rgba(94,186,0,${parseFloat(callPerc) + 0.2})`;
          }
        }
        calendarData +=
          `
          <td style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 1px 1px 1px 0;">
              <table class="calendar-day rounded  other-month bg-green-lightest" cellspacing="0" cellpadding="0" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; border-collapse: separate; width: 100%; color: #000; border-radius: 3px; border: transparent; background: ${bgColor};" bgcolor="transparent">
                  <tr>
                      <td title="${currentDay > 0 ? totalCalls : ''}" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; padding: 10px 0;">${currentDay > 0 ? currentDay : ''}</td>
                  </tr>
              </table>
          </td>
          `;

      }

      calendarData +=
        `
        </tr>
        `;

    }
  }

  return calendarData;
}

function avgWaitDonut(data){

  //wait comparison metrics
  let avgSLAWait = 0;
  let avgDonutPerc = 0;
  if(data.completedSLA > 0){
    avgSLAWait = Math.round(data.totalTimeSLA / data.completedSLA);
    avgDonutPerc = Math.round((avgSLAWait / 30) * 100);
  }

  return `<td width="80" height="80" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; color: #444444; font-size: 13px; background: url(https://miscdts.s3.amazonaws.com/voxo-assets/email/images/donut-charts/blue/${avgDonutPerc}.png) 0% 0% / 100%;" valign="center" class="text-default text-center font-sm" align="center">
            <div class="h4 m-0 text-blue lh-1" style="font-weight: 600; font-size: 16px; color: #467fcf; line-height: 100%; margin: 0;">${avgSLAWait}
              <div class="text-muted font-sm font-normal mt-xs" style="color: #9eb0b7; font-size: 13px; font-weight: 400; margin-top: 4px;">of 30s</div>
            </div>
          </td>`;
}

function callsOverTwoDonut(data){

  const overTwoPerc = Math.round((data.waitOverTwo / data.totalIncoming) * 100);

  return `<td width="80" height="80" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; color: #444444; font-size: 13px; background: url(https://miscdts.s3.amazonaws.com/voxo-assets/email/images/donut-charts/red/${overTwoPerc}.png) 0% 0% / 100%;" valign="center" class="text-default text-center font-sm" align="center">
            <div class="h4 m-0 text-red lh-1" style="font-weight: 600; font-size: 16px; color: #cd201f; line-height: 100%; margin: 0;">${data.waitOverTwo}
              <div class="text-muted font-sm font-normal mt-xs" style="color: #9eb0b7; font-size: 13px; font-weight: 400; margin-top: 4px;">of ${data.totalIncoming}</div>
            </div>
          </td>`;
}

function overTwoCompareTrend(data){

  const overTwoDifference = data.waitOverTwo - data.lastMonthOverTwo;

  //if difference is negative we show a decrease trend
  if(overTwoDifference < 0){
    return `<div class="h1 m-0" style="font-weight: 300; font-size: 28px; line-height: 130%; margin: 0;">
            <img src="https://s3.amazonaws.com/miscdts/voxo-assets/email/images/icons/green/trending-down.png" class=" mr-sm va-middle" width="24" height="24" alt="trending-down" style="line-height: 100%; outline: none; text-decoration: none; vertical-align: middle; font-size: 0; margin-right: 8px; border: 0 none;" />
            ${Math.abs(overTwoDifference)}
          </div>
          <div class="text-muted font-sm" style="color: #9eb0b7; font-size: 13px;">less calls waited over 2m than last month</div>`;
  }

  //if difference is positive we show a increase trend
  if(overTwoDifference > 0){
    return `<div class="h1 m-0" style="font-weight: 300; font-size: 28px; line-height: 130%; margin: 0;">
            <img src="https://s3.amazonaws.com/miscdts/voxo-assets/email/images/icons/red/trending-up.png" class=" mr-sm va-middle" width="24" height="24" alt="trending-down" style="line-height: 100%; outline: none; text-decoration: none; vertical-align: middle; font-size: 0; margin-right: 8px; border: 0 none;" />
            ${Math.abs(overTwoDifference)}
          </div>
          <div class="text-muted font-sm" style="color: #9eb0b7; font-size: 13px;">more calls waited over 2m than last month</div>`;
  }

  //if difference is zero there was no change
  if(overTwoDifference === 0){
    return `<div class="h1 m-0" style="font-weight: 300; font-size: 28px; line-height: 130%; margin: 0;">
            </div>
            <div class="text-muted font-sm" style="color: #9eb0b7; font-size: 13px;">No Change From Last Month</div>`;
  }
}

function callsSLA(data) {
  const slaPerc = Math.round((data.completedSLA / data.totalIncoming) * 100);

  return `<td width="80" height="80" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; color: #444444; font-size: 13px; background: url(https://miscdts.s3.amazonaws.com/voxo-assets/email/images/donut-charts/red/${slaPerc}.png) 0% 0% / 100%;" valign="center" class="text-default text-center font-sm" align="center">
            <div class="h4 m-0 text-red lh-1" style="font-weight: 600; font-size: 16px; color: #cd201f; line-height: 100%; margin: 0;">${data.completedSLA}
              <div class="text-muted font-sm font-normal mt-xs" style="color: #9eb0b7; font-size: 13px; font-weight: 400; margin-top: 4px;">of ${data.totalIncoming}</div>
            </div>
          </td>`;
}

function callsAbandoned(data) {

  const abandPerc = Math.round((data.totalAbandoned / data.totalIncoming) * 100);

  return `<td width="80" height="80" style="font-family: Open Sans, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, Helvetica, Arial, sans-serif; color: #444444; font-size: 13px; background: url(https://miscdts.s3.amazonaws.com/voxo-assets/email/images/donut-charts/red/${abandPerc}.png) 0% 0% / 100%;" valign="center" class="text-default text-center font-sm" align="center">
            <div class="h4 m-0 text-red lh-1" style="font-weight: 600; font-size: 16px; color: #cd201f; line-height: 100%; margin: 0;">${data.totalAbandoned}
              <div class="text-muted font-sm font-normal mt-xs" style="color: #9eb0b7; font-size: 13px; font-weight: 400; margin-top: 4px;">of ${data.totalIncoming}</div>
            </div>
          </td>`;
}

import React/*, { Component }*/ from 'react';
import recycle from 'recycle';

import Paper   from 'material-ui/Paper';
import Subheader from 'material-ui/Subheader';
import {List, ListItem} from 'material-ui/List';

import ActionReportProblem from 'material-ui/svg-icons/action/report-problem';
import EditorInsertDriveFile from 'material-ui/svg-icons/editor/insert-drive-file';
import MapsLocalOffer from 'material-ui/svg-icons/maps/local-offer';
import MapsMap from 'material-ui/svg-icons/maps/map';

import dateformat from 'dateformat';

import Streams from '../Streams';
import ZAF from '../sources/ZAFClient';
import Pendo from '../sources/PendoClient';

const getDay = (d) => dateformat(d, 'fullDate')
const getTimeOfDay = (d) => dateformat(d, 'longTime')


const lookupItem = (item, lookupMap) => {

  if (item.type === 'ticket') return "Ticket Submitted";

  const id = item.pageId || item.featureId || item.guideId;

  if (!lookupMap[item.type][id]) return `${item.type} (${id})`;

  const model = lookupMap[item.type][id];
  console.log(model);

  return `${model.name}`;
}

const getIcon = (type) => {
  if (type === 'page') return (<EditorInsertDriveFile/>);
  if (type === 'feature') return (<MapsLocalOffer/>);
  if (type === 'guide') return (<MapsMap/>);
  else return (<ActionReportProblem/>);
}

const onItemTouch = (item) => {
  const id = item.pageId || item.featureId || item.guideId;
  window.open(`${Pendo.url}/${item.type}s/${id}`, '_newtab');
}

const Timeline = recycle({
  initialState: {
    ts: null,
    day: '',
    time: '',
    history: [],
    lookup: {
      page: {},
      feature: {},
      guide: {}
    }
  },
  update (sources) {
    return [
      ZAF.getTicketCreateDate()
        .reducer( (state, date) => {
          state.day = getDay(date);
          state.time = getTimeOfDay(date);
          state.ts = date.getTime();
          return state;
        }),

      Streams.getVisitorHistory()
        .reducer( (state, history) => {
          state.history = history;
          return state;
        }),

      Streams.getPendoModels()
        .reducer( (state, models) => {
          console.log(models);
          const guides = models[0],
            pages = models[1],
            features = models[2];

          guides.map((g) => state.lookup.guide[g.id] = g);
          pages.map((p) => state.lookup.page[p.id] = p);
          features.map((f) => state.lookup.feature[f.id] = f);

          console.log(state.lookup);

          return state;
        })
    ]
  },
  effects (sources) {
    return []
  },
  view (props, state) {
    return (
      <div>
        <Subheader>{state.day}</Subheader>
        <Paper zDepth={0} style={{margin: '5px 5px 15px'}}>
          <List>
            <ListItem disabled={true}
              style={{background: '#fffbe5', border: '1px solid #ecb'}}
              leftIcon={getIcon('ticket')}
              primaryText={lookupItem({type:'ticket'})}>
                <div style={{'float':'right', 'font-size':'10px'}}>{state.time}</div>
            </ListItem>
            {state.history.map((item) =>
              <ListItem
                onTouchTap={(e) => onItemTouch(item)}
                leftIcon={getIcon(item.type)}
                primaryText={lookupItem(item, state.lookup)}>
                  <div style={{float: 'right', 'font-size':'10px'}}>{getTimeOfDay(new Date(item.ts))}</div>
              </ListItem>
            )}
          </List>
          {!state.history.length &&
            <div>No history to show on the timeline.</div>
          }
        </Paper>
      </div>
    );
  }
})

export default Timeline;
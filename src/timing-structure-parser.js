import _ from "lodash"

/**
 * A class parses and formats <code>bpm_events</code> and <code>stop_events</code>.
 */
export default class TimingStructureParser {
  /**
   * Parse and format timing events.
   * It will merge BPM and STOP events which is at same pulse, and sort them in ascending pulse order.
   * It will also remove unnecessary BPM change whose value is unchanged.
   * <code>bmson.info.init_bpm</code> will be interpreted as y=0 bpm.
   * You can construct timing table from timing structore object by using {@link TimingTableConstructor}.
   * @param  {Object}   bmson A valid bmson that will be parsed.
   * @return {Object[]}       A timing structure object.
   */
  parse(bmson) {
    let structure = []

    let unsortedEvents = new Array()
    unsortedEvents.push({ type: "bpm", y: 0, bpm: bmson.info.init_bpm })
    unsortedEvents.push(... bmson.bpm_events.map((e) => { return { type: "bpm", y: e.y, bpm: e.bpm } }))
    unsortedEvents.push(... bmson.stop_events.map((e) => { return { type: "stop", y: e.y, value: e.value } }))

    // stable sort
    const sortedEvents = _.sortBy(unsortedEvents, (e) => e.y)
    const sortedPulses = _.uniq(sortedEvents.map((e) => e.y))

    // for removal of duplication
    let lastBpm = null

    sortedPulses.forEach((pulse) => {
      const events = sortedEvents.filter((event) => event.y == pulse)
      const bpmEvent = _.findLast(events, (event) => event.type == "bpm")
      const stopDuration = _.reduce(events.filter((event) => event.type == "stop"), (result, event) => result + event.value, 0)

      let eventToPut = {}
      eventToPut.y = pulse

      if(bpmEvent && bpmEvent.bpm != lastBpm) {
        eventToPut.bpm = bpmEvent.bpm
        lastBpm = bpmEvent.bpm
      } else {
        eventToPut.bpm = null
      }

      if(stopDuration > 0) {
        eventToPut.stop = stopDuration
      } else {
        eventToPut.stop = null
      }

      // When bpm value is same as previous one, both events are set to null due to its removal
      if(eventToPut.bpm != null || eventToPut.stop != null) structure.push(eventToPut)
    })

    return structure
  }
}

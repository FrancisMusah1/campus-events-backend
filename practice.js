    function isEventFull(currentAttendees, maxAttendees) {
        if (currentAttendees >= maxAttendees) {
        return true;
      } else {
        return false;
      }
    }
    console.log(isEventFull(50, 50));
    console.log(isEventFull(30, 50));

    const attendeeNames = ["Ama", "Kofi", "Yaw"];
    console.log(attendeeNames);

    for (const name of attendeeNames) {
        console.log(name);
      }
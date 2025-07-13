const EMULATOR_EVENTS = {
  cpu: {
    cycleComplete: "cpu_cycle_complete",
    interruptRequest: "cpu_interrupt_request",
    halt: "cpu_halt",
    unhalt: "cpu_unhalt",
    pause: "cpu_pause",
    unpause: "cpu_unpause",
  },

  system: {
    reset: "system_reset",
    romLoad: "system_rom_load",
    pause: "system_pause",
    unpause: "system_unpause",
    error: "system_error",
  },
};

function createEmulatorMediator() {
  const components = new Map();
  const eventSubscribers = new Map();

  function registerComponent(name, component) {
    components.set(name, component);
  }

  function unregisterComponent(name) {
    components.delete(name);
  }

  function subscribe(event, callback) {
    if (!eventSubscribers.has(event)) {
      eventSubscribers.set(event, []);
    }
    eventSubscribers.get(event).push(callback);
  }

  function unsubscribe(event, callback) {
    if (eventSubscribers.has(event)) {
      const callbacks = eventSubscribers.get(event);
      const index = callbacks.indexOf(callback);
      callbacks.splice(index, 1);
    }
  }

  function publish(event, data = {}, sender = null) {
    const eventData = {
      event,
      data,
      sender,
    };

    if (eventSubscribers.has(event)) {
      const callbacks = eventSubscribers.get(event);
      callbacks.forEach((callback) => {
        try {
          callback(eventData);
        } catch (error) {
          console.error(`[Mediator] 이벤트 처리 중 오류: ${event}`, error);
        }
      });
    }
  }

  function resolveEventKey(target, action) {
    return EMULATOR_EVENTS?.[target]?.[action] || null;
  }

  function notify(sender, target, action, data = {}) {
    const targetComponent = components.get(target);
    if (targetComponent && typeof targetComponent[action] === "function") {
      try {
        const result = targetComponent[action](data);
        const eventKey = resolveEventKey(target, action);
        if (eventKey) {
          publish(eventKey, { data, result }, sender);
        } else {
          console.warn(`[Mediator] 이벤트 키를 찾을 수 없음: ${target}.${action}`);
        }
      } catch (error) {
        console.error(`[Mediator] 컴포넌트 통신 오류: ${sender} -> ${target}.${action}`, error);
      }
    }
  }

  function getComponent(name) {
    return components.get(name);
  }

  function resetSystem() {
    publish(EMULATOR_EVENTS.system.reset);

    components.forEach((component, name) => {
      if (component.reset) {
        try {
          component.reset();
        } catch (error) {
          console.error(`[Mediator] ${name} 리셋 실패:`, error);
        }
      }
    });
  }

  return Object.freeze({
    registerComponent,
    unregisterComponent,
    subscribe,
    unsubscribe,
    publish,
    notify,
    getComponent,

    resetSystem,
    EVENTS: EMULATOR_EVENTS,
  });
}

export default createEmulatorMediator;

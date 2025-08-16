interface Component {
  [key: string]: any;
  reset?: () => void;
}

interface EventData {
  event: string;
  data: any;
  sender: string | null;
}

interface EventCallback {
  (eventData: EventData): void;
}

interface EmulatorEvents {
  cpu: {
    frameComplete: string;
  };
  memory: {
    romLoaded: string;
  };
  system: {
    reset: string;
    romLoad: string;
    pause: string;
    unpause: string;
    error: string;
  };
}

export interface EmulatorMediator {
  registerComponent(name: string, component: Component): void;
  unregisterComponent(name: string): void;
  subscribe(event: string, callback: EventCallback): void;
  unsubscribe(event: string, callback: EventCallback): void;
  publish(event: string, data?: any, sender?: string | null): void;
  notify(sender: string, target: string, action: string, data?: any): void;
  getComponent(name: string): Component | undefined;
  resetSystem(): void;
  EVENTS: EmulatorEvents;
}

const EMULATOR_EVENTS: EmulatorEvents = {
  cpu: {
    frameComplete: "cpu_frame_complete",
  },
  memory: {
    romLoaded: "memory_rom_loaded",
  },
  system: {
    reset: "system_reset",
    romLoad: "system_rom_load",
    pause: "system_pause",
    unpause: "system_unpause",
    error: "system_error",
  },
};

function createEmulatorMediator(): EmulatorMediator {
  const components = new Map<string, Component>();
  const eventSubscribers = new Map<string, EventCallback[]>();

  function registerComponent(name: string, component: Component): void {
    components.set(name, component);
  }

  function unregisterComponent(name: string): void {
    components.delete(name);
  }

  function subscribe(event: string, callback: EventCallback): void {
    if (!eventSubscribers.has(event)) {
      eventSubscribers.set(event, []);
    }
    const callbacks = eventSubscribers.get(event)!;
    callbacks.push(callback);
  }

  function unsubscribe(event: string, callback: EventCallback): void {
    if (eventSubscribers.has(event)) {
      const callbacks = eventSubscribers.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  function publish(event: string, data: any = {}, sender: string | null = null): void {
    const eventData: EventData = {
      event,
      data,
      sender,
    };

    if (eventSubscribers.has(event)) {
      const callbacks = eventSubscribers.get(event)!;
      callbacks.forEach((callback) => {
        try {
          callback(eventData);
        } catch (error) {
          console.error(`[Mediator] 이벤트 처리 중 오류: ${event}`, error);
        }
      });
    }
  }

  function resolveEventKey(target: string, action: string): string | null {
    return (EMULATOR_EVENTS as any)?.[target]?.[action] || null;
  }

  function notify(sender: string, target: string, action: string, data: any = {}): void {
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

  function getComponent(name: string): Component | undefined {
    return components.get(name);
  }

  function resetSystem(): void {
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

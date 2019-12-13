import {Vue} from "vue-property-decorator";

/**
 * This is the class of the global object that holds the state of the drag and drop during its progress. It emits all
 * kinds of events during the progress of the drag and drop. Its data is reactive and listeners can be attachted to it
 * using the method on.
 */
export class DnD {

    public inProgress = false;
    public started = false;
    public type: any = null;
    public data: any = null;
    public source: Vue = null;
    public stack: Vue[] = null;
    public position: { x: number, y: number } = null;
    private eventBus = new Vue();

    constructor() {
    }

    public startDrag(source: Vue, event: MouseEvent, type, data) {
        this.type = type;
        this.data = data;
        this.source = source;
        this.stack = this.ancestors(this.source);
        this.position = {
            x: event.pageX,
            y: event.pageY
        };
        this.inProgress = true;
        Vue.nextTick(() => {
            this.started = true;
            this.emit("dragstart");
            this.emit('dragtopchanged', {from: null});
            this.emit('dragpositionchanged');
        });
    }

    public stopDrag() {
        this.emit('dragtopchanged', {
            from: this.top(),
            to: null
        });
        this.emit("dragend");
        this.inProgress = false;
        this.data = null;
        this.source = null;
        this.stack = null;
        this.position = null;
        this.started = false;
    }

    protected ancestors(comp: Vue) {
        let stack = [];
        if (comp.$parent) {
            stack.push(...this.ancestors(comp.$parent));
        }
        if (comp['isDrop']) {
            if (comp['_acceptsType'](this.type)) {
                stack.push(comp);
            }
        } else if (comp['isDropMask']) {
            stack.push(comp);
        }
        return stack;
    }

    public mouseEnter(enter: Vue) {
        let from = this.top();
        this.stack.push(enter);
        this.emit('dragtopchanged', {from});
    }

    public mouseLeave(leave: Vue) {
        let from = leave;
        this.stack.pop();
        this.emit('dragtopchanged', {from});
    }

    public mouseMove(event) {
        this.position = {
            x: event.clientX,
            y: event.clientY
        };
        this.emit('dragpositionchanged');
    }

    public top() {
        return this.stack.length === 0 ? null : this.stack[this.stack.length - 1];
    }

    private emit(event, data?) {
        if (this.started) {
            this.eventBus.$emit(event, {
                type: this.type,
                data: this.data,
                top: this.top(),
                source: this.source,
                position: this.position,
                ...data
            });
        }
    }

    public on(event, callback) {
        this.eventBus.$on(event, callback);
    }

    public off(event, callback) {
        this.eventBus.$off(event, callback);
    }

}

export let dnd = new DnD();
dnd = Vue.observable(dnd);
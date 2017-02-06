import {expect, spy, restore} from '../test';
import Event, {addDOMEventTargetMethods} from '../../src/tabris/Event';

describe('Event', function() {

  afterEach(restore);

  describe('event constants', function() {
    const EVENT_CONSTANTS = {NONE: 0, CAPTURING_PHASE: 1, AT_TARGET: 2, BUBBLING_PHASE: 3};

    it('are available on constructor and instance', function() {
      let event = new Event('foo');
      for (let name in EVENT_CONSTANTS) {
        expect(Event[name]).to.equal(EVENT_CONSTANTS[name]);
        expect(event[name]).to.equal(EVENT_CONSTANTS[name]);
      }
    });

    it('are read-only', function() {
      let event = new Event('foo');
      for (let name in EVENT_CONSTANTS) {
        Event[name] = 23;
        event[name] = 23;
        expect(Event[name]).to.equal(EVENT_CONSTANTS[name]);
        expect(event[name]).to.equal(EVENT_CONSTANTS[name]);
      }
    });

  });

  describe('constructor', function() {

    it('throws for missing parameter', function() {
      expect(() => new Event()).to.throw(Error, 'Not enough arguments');
    });

    it('sets type from parameter', function() {
      let event = new Event('type');
      expect(event.type).to.equal('type');
    });

    it('sets values from second parameter', function() {
      let target = {};
      let event = new Event('type', {bubbles: true, cancelable: true, target});
      expect(event.bubbles).to.equal(true);
      expect(event.cancelable).to.equal(true);
    });

    it('sets current timestamp', function() {
      let event = new Event('type');

      expect(event.timeStamp).to.be.above(0);
      expect(event.timeStamp).to.be.closeTo(Date.now(), 10);
    });

  });

  describe('instance', function() {

    let event;

    beforeEach(function() {
      event = new Event('type');
    });

    describe('properties', function() {

      it('have default values', function() {
        expect(event.bubbles).to.equal(false);
        expect(event.cancelable).to.equal(false);
        expect(event.target).to.equal(null);
        expect(event.currentTarget).to.equal(null);
        expect(event.defaultPrevented).to.equal(false);
        expect(event.eventPhase).to.equal(0);
        expect(event.isTrusted).to.equal(false);
      });

      it('are read-only', function() {
        event.bubbles = true;
        event.cancelable = true;
        event.target = {};
        event.currentTarget = {};
        event.defaultPrevented = true;
        event.eventPhase = 3;
        event.isTrusted = true;

        expect(event.bubbles).to.equal(false);
        expect(event.cancelable).to.equal(false);
        expect(event.target).to.equal(null);
        expect(event.currentTarget).to.equal(null);
        expect(event.defaultPrevented).to.equal(false);
        expect(event.eventPhase).to.equal(0);
        expect(event.isTrusted).to.equal(false);
      });

    });

    describe('initEvent', function() {

      it('throws for missing parameter', function() {
        expect(() => event.initEvent()).to.throw(Error, 'Not enough arguments');
        expect(() => event.initEvent('foo')).to.throw(Error, 'Not enough arguments');
        expect(() => event.initEvent('foo', true)).to.throw(Error, 'Not enough arguments');
      });

      it('sets type, bubbles, cancelable', function() {
        event.initEvent('foo', true, true);

        expect(event.type).to.equal('foo');
        expect(event.bubbles).to.equal(true);
        expect(event.cancelable).to.equal(true);
      });

    });

    describe('stopPropagation', function() {

      it('can be called', function() {
        event.stopPropagation();
      });

    });

    describe('stopImmediatePropagation', function() {

      it('can be called', function() {
        event.stopImmediatePropagation();
      });

    });

    describe('preventDefault', function() {

      it('sets defaultPrevented if cancelable', function() {
        event = new Event('foo', {cancelable: true});

        event.preventDefault();

        expect(event.defaultPrevented).to.be.true;
      });

      it('does not set defaultPrevented if not cancelable', function() {
        event.preventDefault();

        expect(event.defaultPrevented).to.be.false;
      });

    });

  });

  describe('addDOMEventTargetMethods', function() {

    let target;

    beforeEach(function() {
      target = {};
      addDOMEventTargetMethods(target);
    });

    it('adds methods to target', function() {
      expect(target.addEventListener).to.be.a('function');
      expect(target.removeEventListener).to.be.a('function');
      expect(target.dispatchEvent).to.be.a('function');
    });

    it('does not overwrite existing window methods', function() {
      let orig = function() {};
      let target = {
        addEventListener: orig,
        removeEventListener: orig,
        dispatchEvent: orig
      };

      addDOMEventTargetMethods(target);

      expect(target.addEventListener).to.equal(orig);
      expect(target.removeEventListener).to.equal(orig);
      expect(target.dispatchEvent).to.equal(orig);
    });

    describe('addEventListener', function() {

      it('throws if arguments missing', function() {
        expect(() => target.addEventListener()).to.throw(Error, 'Not enough arguments');
        expect(() => target.addEventListener('foo')).to.throw(Error, 'Not enough arguments');
      });

    });

    describe('removeEventListener', function() {

      it('throws if arguments missing', function() {
        expect(() => target.removeEventListener()).to.throw(Error, 'Not enough arguments');
        expect(() => target.removeEventListener('foo')).to.throw(Error, 'Not enough arguments');
      });

    });

    describe('dispatchEvent', function() {

      let listener;

      beforeEach(function() {
        listener = spy();
      });

      it('throws if arguments missing', function() {
        expect(() => target.dispatchEvent()).to.throw(Error, 'Not enough arguments');
      });

      it('throws if argument is not an Event', function() {
        expect(() => target.dispatchEvent({})).to.throw(Error, 'Invalid event');
      });

      it('notifies all listeners for same type', function() {
        let listener2 = spy();
        target.addEventListener('foo', listener);
        target.addEventListener('foo', listener2);

        target.dispatchEvent(new Event('foo'));

        expect(listener).to.have.been.calledOnce;
        expect(listener2).to.have.been.calledOnce;
      });

      it('does not notify listeners for different type', function() {
        let event = new Event('bar');

        target.dispatchEvent(event);

        expect(listener).to.have.not.been.called;
      });

      it('passes event to listeners', function() {
        target.addEventListener('foo', listener);
        let event = new Event('foo');

        target.dispatchEvent(event);

        expect(listener).to.have.been.calledWith(event);
      });

      it('sets event target', function() {
        let event = new Event('foo');

        target.dispatchEvent(event);

        expect(event.target).to.equal(target);
      });

      it('sets event target before notifying listeners', function() {
        target.addEventListener('foo', listener);
        let event = new Event('foo');

        target.dispatchEvent(event);

        expect(listener.args[0][0].target).to.equal(target);
      });

      it('returns true if event is not cancelled', function() {
        expect(target.dispatchEvent(new Event('foo'))).to.be.true;
      });

      it('returns false if event is cancelled', function() {
        let event = new Event('foo', {cancelable: true});

        event.preventDefault();

        expect(target.dispatchEvent(event)).to.be.false;
      });

      describe('when listener is added twice', function() {

        it('will be called only once', function() {
          target.addEventListener('foo', listener);
          target.addEventListener('foo', listener);

          target.dispatchEvent(new Event('foo'));

          expect(listener).to.have.been.calledOnce;
        });

        it('can be removed once', function() {
          target.addEventListener('foo', listener);
          target.addEventListener('foo', listener);
          target.removeEventListener('foo', listener);

          target.dispatchEvent(new Event('foo'));

          expect(listener).to.not.have.been.called;
        });

      });

      describe('when listener is added and removed', function() {

        beforeEach(function() {
          target.addEventListener('foo', listener);
          target.removeEventListener('foo', listener);
        });

        it('is not notified anymore', function() {
          target.dispatchEvent(new Event('foo'));

          expect(listener).to.have.not.been.called;
        });

      });

      describe('when listener is removed and added again', function() {

        beforeEach(function() {
          target.addEventListener('foo', listener);
          target.removeEventListener('foo', listener);
          target.addEventListener('foo', listener);
        });

        it('is notified again', function() {
          target.dispatchEvent(new Event('foo'));

          expect(listener).to.have.been.calledOnce;
        });

      });

    });

  });

});

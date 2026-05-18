import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Matter from 'matter-js';

const PhysicsCanvas = forwardRef(({ onUpdateStats, activeTool, socket, roomCode, isHost }, ref) => {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  
  const activeToolRef = useRef(activeTool);
  const selectedBodyRef = useRef(null);
  const socketRef = useRef(socket);
  const roomCodeRef = useRef(roomCode);
  const isHostRef = useRef(isHost);

  // NEW: Track the specific body the user is currently dragging
  const draggedBodyRef = useRef(null);

  useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);
  useEffect(() => { socketRef.current = socket; }, [socket]);
  useEffect(() => { roomCodeRef.current = roomCode; }, [roomCode]);
  useEffect(() => { isHostRef.current = isHost; }, [isHost]);

  useImperativeHandle(ref, () => ({
    addSquare: (remoteId = null) => {
      if (!engineRef.current) return;
      const customId = remoteId || `sq-${Date.now()}-${Math.floor(Math.random()*1000)}`;
      const box = Matter.Bodies.rectangle(400, 100, 60, 60, { 
        label: 'tracked-mass', restitution: 0.5, customId: customId, shapeType: 'square'
      });
      Matter.Composite.add(engineRef.current.world, box);
      
      if (!remoteId && socketRef.current && roomCodeRef.current) {
        socketRef.current.emit('action-spawn', { roomCode: roomCodeRef.current, type: 'square', id: customId });
      }
    },
    addCircle: (remoteId = null) => {
      if (!engineRef.current) return;
      const customId = remoteId || `ci-${Date.now()}-${Math.floor(Math.random()*1000)}`;
      const circle = Matter.Bodies.circle(450, 100, 30, {
        label: 'tracked-mass', restitution: 0.8, customId: customId, shapeType: 'circle'
      });
      Matter.Composite.add(engineRef.current.world, circle);

      if (!remoteId && socketRef.current && roomCodeRef.current) {
        socketRef.current.emit('action-spawn', { roomCode: roomCodeRef.current, type: 'circle', id: customId });
      }
    },
    clearWorkspace: (isRemote = false) => {
      if (!engineRef.current) return;
      const world = engineRef.current.world;
      const bodiesToRemove = world.bodies.filter(b => b.label === 'tracked-mass');
      const constraintsToRemove = world.constraints.filter(c => c.label === 'tracked-constraint');
      Matter.Composite.remove(world, bodiesToRemove);
      Matter.Composite.remove(world, constraintsToRemove);

      if (!isRemote && socketRef.current && roomCodeRef.current) {
        socketRef.current.emit('action-clear', roomCodeRef.current);
      }
    },
    saveWorkspace: () => {
      if (!engineRef.current) return null;
      const world = engineRef.current.world;
      const bodies = world.bodies.filter(b => b.label === 'tracked-mass').map(b => ({ id: b.customId, type: b.shapeType, x: b.position.x, y: b.position.y }));
      const constraints = world.constraints.filter(c => c.label === 'tracked-constraint').map(c => ({ bodyAId: c.bodyA.customId, bodyBId: c.bodyB.customId, isSpring: c.stiffness < 0.1 }));
      return JSON.stringify({ bodies, constraints });
    },
    loadWorkspace: (jsonString) => {
      if (!engineRef.current || !jsonString) return;
      const data = JSON.parse(jsonString);
      const world = engineRef.current.world;
      ref.current.clearWorkspace();

      const bodyMap = {}; 
      const newBodies = data.bodies.map(bData => {
        let body;
        if (bData.type === 'square') body = Matter.Bodies.rectangle(bData.x, bData.y, 60, 60, { label: 'tracked-mass', restitution: 0.5, customId: bData.id, shapeType: 'square' });
        else body = Matter.Bodies.circle(bData.x, bData.y, 30, { label: 'tracked-mass', restitution: 0.8, customId: bData.id, shapeType: 'circle' });
        bodyMap[bData.id] = body; 
        return body;
      });
      Matter.Composite.add(world, newBodies);

      const newConstraints = data.constraints.map(cData => {
        const bodyA = bodyMap[cData.bodyAId];
        const bodyB = bodyMap[cData.bodyBId];
        if (!bodyA || !bodyB) return null;
        const newLink = Matter.Constraint.create({
          bodyA: bodyA, bodyB: bodyB, stiffness: cData.isSpring ? 0.05 : 0.9,
          render: { visible: true, lineWidth: cData.isSpring ? 4 : 2, strokeStyle: cData.isSpring ? '#10b981' : '#f59e0b', type: cData.isSpring ? 'spring' : 'line' }
        });
        newLink.label = 'tracked-constraint';
        return newLink;
      }).filter(Boolean); 
      Matter.Composite.add(world, newConstraints);
    }
  }));

  useEffect(() => {
    const { Engine, Render, Runner, Bodies, Composite, Events, Mouse, MouseConstraint, Constraint } = Matter;

    const engine = Engine.create();
    engineRef.current = engine;

    const render = Render.create({
      element: sceneRef.current, engine: engine,
      options: { width: 800, height: 600, wireframes: false, background: 'transparent' }
    });

    const floor = Bodies.rectangle(400, 850, 810, 600, { isStatic: true, render: { fillStyle: '#334155' } });
    const leftWall = Bodies.rectangle(-25, 300, 50, 600, { isStatic: true, render: { visible: false } });
    const rightWall = Bodies.rectangle(825, 300, 50, 600, { isStatic: true, render: { visible: false } });
    const ceiling = Bodies.rectangle(400, -25, 810, 50, { isStatic: true, render: { visible: false } });
    Composite.add(engine.world, [floor, leftWall, rightWall, ceiling]);

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse, constraint: { stiffness: 0.2, render: { visible: false } }
    });
    Composite.add(engine.world, mouseConstraint);
    render.mouse = mouse;

    // --- NEW HELPER: Creates linkage locally AND visually ---
    const createLocalLink = (bodyA, bodyB, isSpring) => {
      const newLink = Constraint.create({
        bodyA: bodyA, bodyB: bodyB, stiffness: isSpring ? 0.05 : 0.9,
        render: { visible: true, lineWidth: isSpring ? 4 : 2, strokeStyle: isSpring ? '#10b981' : '#f59e0b', type: isSpring ? 'spring' : 'line' }
      });
      newLink.label = 'tracked-constraint';
      Composite.add(engine.world, newLink);
    };

    // --- MOUSE EVENTS: TRACK DRAGGING AND CLICKING ---
    Events.on(mouseConstraint, 'startdrag', (event) => {
      if (event.body) draggedBodyRef.current = event.body;
    });

    Events.on(mouseConstraint, 'enddrag', () => {
      draggedBodyRef.current = null;
    });

    Events.on(mouseConstraint, 'mousedown', function(event) {
      const tool = activeToolRef.current;
      const clickedBody = mouseConstraint.body; 

      if (tool === 'cursor' || !clickedBody) return;

      if (!selectedBodyRef.current) {
        selectedBodyRef.current = clickedBody;
        clickedBody.render.lineWidth = 3;
        clickedBody.render.strokeStyle = '#facc15'; 
      } else {
        const bodyA = selectedBodyRef.current;
        const bodyB = clickedBody;

        if (bodyA.id !== bodyB.id) {
          const isSpring = tool === 'spring';
          createLocalLink(bodyA, bodyB, isSpring);

          // NEW: Broadcast link creation to the room!
          if (socketRef.current && roomCodeRef.current) {
            socketRef.current.emit('action-link', {
              roomCode: roomCodeRef.current,
              bodyAId: bodyA.customId,
              bodyBId: bodyB.customId,
              isSpring: isSpring
            });
          }
        }
        bodyA.render.lineWidth = 0;
        selectedBodyRef.current = null;
      }
    });

    // ==========================================
    // --- THE AGENT MIDDLEWARE (MULTIPLAYER) ---
    // ==========================================
    let frameCount = 0;
    
    Events.on(engine, 'beforeUpdate', () => {
      // NEW: We removed the Guest restriction here so Guests can click!
      if (activeToolRef.current !== 'cursor') {
        mouseConstraint.constraint.stiffness = 0; 
      } else {
        mouseConstraint.constraint.stiffness = 0.2; 
      }
    });

    Events.on(engine, 'afterUpdate', () => {
      frameCount++;
      const trackedBodies = engine.world.bodies.filter(b => b.label === 'tracked-mass');
      
      // 1. HOST LOGIC: Broadcast positions to the server
      if (isHostRef.current && roomCodeRef.current && socketRef.current && frameCount % 2 === 0) {
        const syncData = trackedBodies.map(b => ({ id: b.customId, x: b.position.x, y: b.position.y, angle: b.angle }));
        socketRef.current.emit('sync-physics', { roomCode: roomCodeRef.current, bodies: syncData });
      }

      // 2. GUEST DRAG LOGIC: Tell the host I am moving something!
      if (!isHostRef.current && draggedBodyRef.current && socketRef.current && roomCodeRef.current) {
        socketRef.current.emit('guest-dragging', {
          roomCode: roomCodeRef.current,
          id: draggedBodyRef.current.customId,
          x: draggedBodyRef.current.position.x,
          y: draggedBodyRef.current.position.y,
          vx: draggedBodyRef.current.velocity.x,
          vy: draggedBodyRef.current.velocity.y
        });
      }

      // 3. ANALYTICS
      if (frameCount % 6 === 0 && trackedBodies.length > 0) { 
        const targetBody = trackedBodies[trackedBodies.length - 1]; 
        const speed = targetBody.speed; 
        const kineticEnergy = 0.5 * targetBody.mass * Math.pow(speed, 2);
        onUpdateStats({ time: Date.now(), speed: parseFloat(speed.toFixed(2)), kineticEnergy: parseFloat(kineticEnergy.toFixed(2)) });
      }
    });

    // --- SOCKET EVENT LISTENERS ---
    if (socket) {
      // Receive physics from Host
      socket.on('physics-updated', (remoteBodies) => {
        if (isHostRef.current) return; 
        
        remoteBodies.forEach(remoteData => {
          const localBody = engine.world.bodies.find(b => b.customId === remoteData.id);
          // CRITICAL FIX: Do NOT accept Host override if I am the one dragging this block!
          const isBeingDraggedByMe = draggedBodyRef.current && draggedBodyRef.current.customId === remoteData.id;
          
          if (localBody && !isBeingDraggedByMe) {
            Matter.Body.setPosition(localBody, { x: remoteData.x, y: remoteData.y });
            Matter.Body.setAngle(localBody, remoteData.angle);
            Matter.Body.setVelocity(localBody, { x: 0, y: 0 }); 
          }
        });
      });

      // Receive Guest Drag Coordinates (Host Only)
      socket.on('host-override-drag', (dragData) => {
        if (isHostRef.current) {
          const localBody = engine.world.bodies.find(b => b.customId === dragData.id);
          if (localBody) {
            Matter.Body.setPosition(localBody, { x: dragData.x, y: dragData.y });
            Matter.Body.setVelocity(localBody, { x: dragData.vx, y: dragData.vy });
          }
        }
      });

      // Receive Remote Link Creation
      socket.on('remote-link', (data) => {
        const bodyA = engine.world.bodies.find(b => b.customId === data.bodyAId);
        const bodyB = engine.world.bodies.find(b => b.customId === data.bodyBId);
        if (bodyA && bodyB) {
          createLocalLink(bodyA, bodyB, data.isSpring);
        }
      });

      socket.on('remote-spawn', (data) => {
        if (data.type === 'square') ref.current.addSquare(data.id);
        if (data.type === 'circle') ref.current.addCircle(data.id);
      });

      socket.on('remote-clear', () => {
        ref.current.clearWorkspace(true);
      });
    }

    return () => {
      Render.stop(render);
      Runner.stop(runner);
      if (sceneRef.current) sceneRef.current.innerHTML = '';
      Composite.clear(engine.world);
      Engine.clear(engine);
      if (socket) {
        socket.off('physics-updated');
        socket.off('remote-spawn');
        socket.off('remote-clear');
        socket.off('remote-link');
        socket.off('host-override-drag');
      }
    };
  }, [onUpdateStats, socket]);

  return <div ref={sceneRef} className="rounded-lg overflow-hidden border border-slate-700 shadow-xl bg-slate-900" />;
});

export default PhysicsCanvas;
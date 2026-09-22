const TAU = Math.PI * 2;
const smooth = x => {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
};
const turn = (from, to, p) => from + Math.atan2(Math.sin(to-from), Math.cos(to-from)) * smooth(p);

// A complete, deterministic walk: turn, approach, face the work, work, and return.
// Foot cadence follows distance so acceleration does not turn into foot sliding.
export function sampleWalk(time, {start, end, travel=2.8, hold=2.5, startFacing=0, endFacing=Math.PI, phase=0}) {
  const heading = Math.atan2(end[0]-start[0], end[1]-start[1]);
  const returning = heading + Math.PI;
  const turning = .48;
  const durations = [.7, turning, travel, turning, hold, turning, travel, turning];
  const total = durations.reduce((a,b)=>a+b,0);
  let t = ((time+phase)%total+total)%total, step=0;
  while(step<durations.length-1 && t>=durations[step]) t-=durations[step++];
  const p=t/durations[step];
  let progress=0, yaw=startFacing, moving=false, stride=0, activity=0, gaitDistance=0, gaitWeight=0;
  if(step===1) yaw=turn(startFacing,heading,p);
  if(step===2||step===6) {
    moving=true;
    // Short eased starts/stops, with constant speed through the middle of an aisle.
    const ramp=.12;
    const distance=p<ramp?p*p/(2*ramp):p>1-ramp?1-ramp-(1-p)*(1-p)/(2*ramp):p-ramp/2;
    const eased=distance/(1-ramp);
    progress=step===2?eased:1-eased;
    yaw=step===2?heading:returning;
    const length=Math.hypot(end[0]-start[0],end[1]-start[1]);
    gaitDistance=eased*length;
    gaitWeight=Math.max(0,Math.min(1,p/ramp,(1-p)/ramp));
    stride=Math.sin(gaitDistance*TAU/.64)*gaitWeight;
  }
  if(step===3){progress=1;yaw=turn(heading,endFacing,p);}
  if(step===4){progress=1;yaw=endFacing;activity=Math.sin(p*Math.PI)**2;}
  if(step===5){progress=1;yaw=turn(endFacing,returning,p);}
  if(step===7) yaw=turn(returning,startFacing,p);
  const lead=(from,to)=>Math.max(-.52,Math.min(.52,Math.atan2(Math.sin(to-from),Math.cos(to-from))*.45));
  const headLead=[
    lead(startFacing,heading)*smooth(p),
    lead(startFacing,heading)*(1-smooth(p)),
    lead(heading,endFacing)*smooth((p-.8)/.2),
    lead(heading,endFacing)*(1-smooth(p)),
    lead(endFacing,returning)*smooth((p-.8)/.2),
    lead(endFacing,returning)*(1-smooth(p)),
    lead(returning,startFacing)*smooth((p-.8)/.2),
    lead(returning,startFacing)*(1-smooth(p)),
  ][step];
  return {x:start[0]+(end[0]-start[0])*progress,z:start[1]+(end[1]-start[1])*progress,yaw,stride,moving,activity,step,stepProgress:p,gaitDistance,gaitWeight,headLead};
}

const ddasTransitions = {
  received:['triaged','rejected_out_of_scope'], triaged:['assigned','rejected_out_of_scope'],
  assigned:['in_progress','waiting_for_information','rejected_out_of_scope'],
  in_progress:['waiting_for_information','resolved'], waiting_for_information:['in_progress','resolved'],
  resolved:['closed','reopened'], closed:['reopened'], reopened:['assigned','in_progress'], rejected_out_of_scope:[],
};
export function canTransitionDdas(from,to){return ddasTransitions[from]?.includes(to)??false}
export function resolvePermission(decisions){if(decisions.some((item)=>item.effect==='deny'))return false;return decisions.some((item)=>item.effect==='allow')}
export function nextCommentDepth(parentDepth,maxDepth=3){const depth=parentDepth==null?0:parentDepth+1;if(depth>maxDepth)throw new Error('COMMENT_DEPTH_EXCEEDED');return depth}
export function safePublicEvent(event){const allowed=['event','version','purpose','category','result','durationBucket'];return Object.fromEntries(Object.entries(event).filter(([key])=>allowed.includes(key)))}

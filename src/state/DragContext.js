import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { BlockList, ARM_WIDTH } from "../components/ScriptBlock";
import { BLOCK_TYPES, cloneBlock } from "../blocks/blockTypes";
import { collectIds, detachChain, insertChain } from "../blocks/scriptTree";
import { useSprites } from "./SpritesContext";

// Pointer must move this far before a press becomes a drag (otherwise it's a click).
const DRAG_THRESHOLD = 4;
// How close a dragged block must be to a connection point to snap to it.
const SNAP_DISTANCE = 30;

const isInside = (element, point) => {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return (
    point.x >= rect.left &&
    point.x <= rect.right &&
    point.y >= rect.top &&
    point.y <= rect.bottom
  );
};

// Finds the nearest connection point in the workspace for the dragged chain.
function findSnap(session, workspace, overlay) {
  if (!workspace || !isInside(workspace, session.pointer)) return null;
  const top = session.position;
  const height = overlay ? overlay.getBoundingClientRect().height : 0;
  const isHatChain = BLOCK_TYPES[session.chain[0].type].hat;
  let best = null;

  const consider = (x, y, anchorY, target) => {
    const distance = Math.hypot(x - top.x, y - anchorY);
    if (distance < SNAP_DISTANCE && (!best || distance < best.distance)) {
      best = { x, y, target, distance };
    }
  };

  // Hat blocks can only start a stack, so they never go under another block
  if (!isHatChain) {
    workspace.querySelectorAll("[data-block-id]").forEach((element) => {
      if (session.chainIds.has(element.dataset.blockId)) return;
      const rect = element.getBoundingClientRect();
      consider(rect.left, rect.bottom, top.y, {
        kind: "after",
        blockId: element.dataset.blockId,
      });
    });
    workspace.querySelectorAll("[data-mouth-of]").forEach((element) => {
      const rect = element.getBoundingClientRect();
      consider(rect.left + ARM_WIDTH, rect.bottom, top.y, {
        kind: "inside",
        blockId: element.dataset.mouthOf,
      });
    });
  }
  // The dragged chain's bottom can attach above a stack that doesn't start with a hat
  workspace.querySelectorAll("[data-stack-id]").forEach((element) => {
    if (element.dataset.hat === "true") return;
    const rect = element.getBoundingClientRect();
    consider(rect.left, rect.top, top.y + height, {
      kind: "before",
      stackId: element.dataset.stackId,
      height,
    });
  });
  return best;
}

const DragContext = createContext(null);

export function DragProvider({ children }) {
  const { getState, dispatch } = useSprites();
  const workspaceRef = useRef(null);
  const paletteRef = useRef(null);
  const overlayRef = useRef(null);
  const [drag, setDrag] = useState(null);

  // source: "palette" (copy the block) or "workspace" (move it and the blocks below)
  const startPointer = useCallback(
    (event, { source, block, onClick }) => {
      if (event.button !== 0 || event.target.tagName === "INPUT") return;
      event.stopPropagation();

      const rect = event.currentTarget.getBoundingClientRect();
      const offset = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      const start = { x: event.clientX, y: event.clientY };
      const spriteId = getState().selectedId;
      const stacksOf = () =>
        getState().sprites.find(({ id }) => id === spriteId).stacks;
      const setStacks = (stacks) =>
        dispatch({ type: "UPDATE_SPRITE", id: spriteId, changes: { stacks } });
      let session = null;

      const begin = () => {
        if (source === "palette") {
          const chain = [cloneBlock(block)];
          return { chain, chainIds: collectIds(chain), snapshot: null };
        }
        const snapshot = stacksOf();
        const { stacks, chain } = detachChain(snapshot, block.id);
        setStacks(stacks);
        return { chain, chainIds: collectIds(chain), snapshot };
      };

      const finish = (pointer) => {
        const { chain, snap, position, snapshot } = session;
        const workspace = workspaceRef.current;
        if (isInside(paletteRef.current, pointer)) return; // dropped on palette = delete
        if (snap) {
          setStacks(insertChain(stacksOf(), snap.target, chain));
        } else if (isInside(workspace, pointer)) {
          const area = workspace.getBoundingClientRect();
          setStacks(
            insertChain(
              stacksOf(),
              {
                kind: "new",
                x: Math.max(0, position.x - area.left + workspace.scrollLeft),
                y: Math.max(0, position.y - area.top + workspace.scrollTop),
              },
              chain
            )
          );
        } else if (snapshot) {
          setStacks(snapshot); // dropped somewhere else: put it back
        }
      };

      const onMove = (moveEvent) => {
        const pointer = { x: moveEvent.clientX, y: moveEvent.clientY };
        if (!session) {
          if (Math.hypot(pointer.x - start.x, pointer.y - start.y) < DRAG_THRESHOLD) return;
          session = begin();
        }
        session.pointer = pointer;
        session.position = { x: pointer.x - offset.x, y: pointer.y - offset.y };
        session.snap = findSnap(session, workspaceRef.current, overlayRef.current);
        setDrag({ ...session });
      };

      const cleanup = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onCancel);
        setDrag(null);
      };

      function onUp(upEvent) {
        cleanup();
        if (!session) {
          if (onClick) onClick();
          return;
        }
        finish({ x: upEvent.clientX, y: upEvent.clientY });
      }

      function onCancel() {
        cleanup();
        if (session && session.snapshot) setStacks(session.snapshot);
      }

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onCancel);
    },
    [getState, dispatch]
  );

  const value = useMemo(
    () => ({ startPointer, workspaceRef, paletteRef }),
    [startPointer]
  );

  return (
    <DragContext.Provider value={value}>
      {children}
      {drag && drag.snap && (
        <div
          className="fixed pointer-events-none z-40 h-1 w-24 bg-gray-500 rounded"
          style={{ left: drag.snap.x, top: drag.snap.y - 2 }}
        />
      )}
      {drag && (
        <div
          ref={overlayRef}
          className="fixed pointer-events-none z-50 flex flex-col items-start opacity-90"
          style={{ left: drag.position.x, top: drag.position.y }}
        >
          <BlockList blocks={drag.chain} />
        </div>
      )}
    </DragContext.Provider>
  );
}

export function useDrag() {
  return useContext(DragContext);
}

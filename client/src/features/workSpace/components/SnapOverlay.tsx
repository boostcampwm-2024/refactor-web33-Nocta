import { SnapTarget } from "@src/types/page";
import { snapSkeleton, snapBox } from "./SnapOverlay.style";

export const SnapOverlay = ({
  activeTarget,
  activeStyle,
  snapTargets,
}: {
  activeTarget: SnapTarget;
  activeStyle: React.CSSProperties;
  snapTargets: SnapTarget[];
}) => {
  return (
    <div className={snapSkeleton}>
      {snapTargets.map((target) => (
        <div
          key={target}
          className={snapBox({ isActive: activeTarget === target })}
          style={activeStyle}
        />
      ))}
    </div>
  );
};

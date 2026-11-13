/**
 * The app's single icon set. Every icon comes from here so the set can be swapped in one place.
 * Navigation icons come in outline / filled pairs: the filled one marks the active section.
 */
import type { ComponentType, SVGAttributes } from "react";
import {
  PiBookmarkSimple,
  PiBookmarkSimpleFill,
  PiCamera,
  PiCaretLeft,
  PiCaretRight,
  PiChatCircle,
  PiCheck,
  PiCheckCircle,
  PiCompass,
  PiCompassFill,
  PiDotsThree,
  PiEye,
  PiEyeSlash,
  PiFilmReel,
  PiFilmReelFill,
  PiGear,
  PiHeart,
  PiHeartFill,
  PiHouse,
  PiHouseFill,
  PiInfo,
  PiList,
  PiListBold,
  PiMagnifyingGlass,
  PiMagnifyingGlassBold,
  PiMessengerLogo,
  PiMessengerLogoFill,
  PiMonitor,
  PiMoon,
  PiPaperPlaneTilt,
  PiPlusSquare,
  PiPlusSquareFill,
  PiSealCheckFill,
  PiSignOut,
  PiSun,
  PiTranslate,
  PiWarningCircle,
  PiX,
} from "react-icons/pi";

export type IconProps = SVGAttributes<SVGElement> & { size?: number | string };
type IconComponent = ComponentType<IconProps>;

/** Builds an icon that switches to its filled variant with `filled` */
function pair(Outline: IconComponent, Filled: IconComponent) {
  return function PairedIcon({ filled = false, ...props }: IconProps & { filled?: boolean }) {
    const Icon = filled ? Filled : Outline;
    return <Icon aria-hidden {...props} />;
  };
}

function single(Icon: IconComponent) {
  return function SingleIcon(props: IconProps) {
    return <Icon aria-hidden {...props} />;
  };
}

export const HomeIcon = pair(PiHouse, PiHouseFill);
export const SearchIcon = pair(PiMagnifyingGlass, PiMagnifyingGlassBold);
export const ExploreIcon = pair(PiCompass, PiCompassFill);
export const ReelsIcon = pair(PiFilmReel, PiFilmReelFill);
export const MessagesIcon = pair(PiMessengerLogo, PiMessengerLogoFill);
export const HeartIcon = pair(PiHeart, PiHeartFill);
export const CreateIcon = pair(PiPlusSquare, PiPlusSquareFill);
export const MenuIcon = pair(PiList, PiListBold);
export const BookmarkIcon = pair(PiBookmarkSimple, PiBookmarkSimpleFill);

export const CommentIcon = single(PiChatCircle);
export const ShareIcon = single(PiPaperPlaneTilt);
export const MoreIcon = single(PiDotsThree);
export const CloseIcon = single(PiX);
export const ChevronLeftIcon = single(PiCaretLeft);
export const ChevronRightIcon = single(PiCaretRight);
export const CheckIcon = single(PiCheck);
export const SettingsIcon = single(PiGear);
export const SunIcon = single(PiSun);
export const MoonIcon = single(PiMoon);
export const SystemThemeIcon = single(PiMonitor);
export const LanguageIcon = single(PiTranslate);
export const LogoutIcon = single(PiSignOut);
export const EyeIcon = single(PiEye);
export const EyeOffIcon = single(PiEyeSlash);
export const CameraIcon = single(PiCamera);
export const InfoIcon = single(PiInfo);
export const SuccessIcon = single(PiCheckCircle);
export const WarningIcon = single(PiWarningCircle);
export const VerifiedIcon = single(PiSealCheckFill);

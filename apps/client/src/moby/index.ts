import { isInsideMoby, type MobyBridge } from './MobyBridge';
import { MockMobyBridge } from './MockMobyBridge';
import { NativeMobyBridge } from './NativeMobyBridge';

export * from './MobyBridge';
export { MockMobyBridge };

export const moby: MobyBridge = isInsideMoby()
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new NativeMobyBridge((window as any).MobyNative)
    : new MockMobyBridge();

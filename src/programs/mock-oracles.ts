import type { AnchorTypes } from "@saberhq/anchor-contrib";
import { MockOraclesIDL } from "../idls/mock_oracles";

export type MockOraclesTypes = AnchorTypes<MockOraclesIDL>;

export type MockOraclesProgram = MockOraclesTypes["Program"];

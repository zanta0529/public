// app_config.js
import AaveV3Adapter from "./adapters/aave/aavev3_adapter.js";
import BeefyAdapter from "./adapters/beefy/beefy_adapter.js";
import FluidAdapter from "./adapters/fluid/fluid_adapter.js";
import MorphoAdapter from "./adapters/morpho/morpho_adapter.js";
import OriginProtocolAdapter from "./adapters/origin-protocol/origin_protocol_adapter.js";
import OndoAdapter from "./adapters/ondo/ondo_adapter.js";

const appConfig = {
    adapters: [
        {
            name: "Aave V3 Adapter",
            adapter: AaveV3Adapter,
            enabled: 0,
        },
        {
            name: "Beefy Finance Adapter",
            adapter: BeefyAdapter,
            enabled: 1,
        },
        {
            name: "Fluid Adapter",
            adapter: FluidAdapter,
            enabled: 1,
        },
        {
            name: "Morpho Adapter",
            adapter: MorphoAdapter,
            enabled: 0,
        },
        {
            name: "Origin Protocol Adapter",
            adapter: OriginProtocolAdapter,
            enabled: 1,
        },
        {
            name: "Ondo Finance Adapter",
            adapter: OndoAdapter,
            enabled: 0,
        },
    ],
};

export default appConfig;

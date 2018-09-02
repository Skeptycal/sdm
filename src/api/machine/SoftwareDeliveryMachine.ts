/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { GoalSetter } from "../mapping/GoalSetter";
import { EventRegistrationManager } from "../registration/EventRegistrationManager";
import { IngesterRegistrationManager } from "../registration/IngesterRegistrationManager";
import { EnforceableProjectInvariantRegistration } from "../registration/ProjectInvariantRegistration";
import { CommandRegistrationManager } from "./CommandRegistrationManager";
import { ExtensionPack } from "./ExtensionPack";
import { FunctionalUnit } from "./FunctionalUnit";
import { GoalDrivenMachine } from "./GoalDrivenMachine";
import { ListenerRegistrationManager } from "./ListenerRegistrationManager";
import { SoftwareDeliveryMachineConfiguration } from "./SoftwareDeliveryMachineOptions";

/**
 * Class instantiated to create a **Software Delivery MachineConfiguration**.
 * Combines commands and delivery event handling using _goals_.
 *
 * Goals and goal "implementations" can be defined by users.
 * However, certain well known goals are built into the TheSoftwareDeliveryMachine
 * for convenience, with their own associated listeners.
 *
 * Well known goal support is based around a delivery process spanning
 * common goals of fingerprinting, reacting to fingerprint diffs,
 * code review, build, deployment, endpoint verification and
 * promotion to a production environment.
 *
 * The most important element of a software delivery machine is setting
 * zero or more _push rules_ in the constructor.
 * This is normally done using the internal DSL as follows:
 *
 * ```
 * const sdm = new TheSoftwareDeliveryMachine(
 *    "MyMachine",
 *    options,
 *    whenPushSatisfies(IsMaven, HasSpringBootApplicationClass, not(MaterialChangeToJavaRepo))
 *      .itMeans("No material change to Java")
 *      .setGoals(NoGoals),
 *    whenPushSatisfies(ToDefaultBranch, IsMaven, HasSpringBootApplicationClass, HasCloudFoundryManifest)
 *      .itMeans("Spring Boot service to deploy")
 *      .setGoals(HttpServiceGoals));
 * ```
 *
 * Uses the builder pattern to allow fluent construction. For example:
 *
 * ```
 * softwareDeliveryMachine
 *    .addPushReactions(async pu => ...)
 *    .addNewIssueListeners(async i => ...)
 *    .add...;
 * ```
 */
export interface SoftwareDeliveryMachine<O extends SoftwareDeliveryMachineConfiguration = SoftwareDeliveryMachineConfiguration>
    extends GoalDrivenMachine<O>,
        ListenerRegistrationManager,
        CommandRegistrationManager,
        EventRegistrationManager,
        IngesterRegistrationManager,
        FunctionalUnit {

    addDisposalRules(...goalSetters: GoalSetter[]): this;

    addVerifyImplementation(): this;

    /**
     * Add an enforceable invariant registration. This will export
     * a CodeTransform, CodeInspection and Autofix.
     * If a ProjectInvariant is not enforceable, it can be
     * registered with addCodeInspection.
     * The transform command is exposed via "transform <intent>"
     * The inspection command is exposed via "verify <intent>"
     * @param {EnforceableProjectInvariantRegistration<PARAMS>} eir
     * @return {this}
     */
    addEnforceableInvariant<PARAMS>(eir: EnforceableProjectInvariantRegistration<PARAMS>): this;

    /**
     * Add capabilities from these extension packs.
     * This is the primary SDM extension
     * mechanism. Extension packs are typically brought in as Node modules,
     * and can contribute goals as well configure SDM behavior.
     * @param {ExtensionPack} packs
     * @return {this}
     */
    addExtensionPacks(...packs: ExtensionPack[]): this;

    readonly extensionPacks: ExtensionPack[];

}

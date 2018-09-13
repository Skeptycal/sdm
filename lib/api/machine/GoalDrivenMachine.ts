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

import { InterpretLog } from "../../spi/log/InterpretedLog";
import { Goal } from "../goal/Goal";
import { ExecuteGoal } from "../goal/GoalInvocation";
import { Goals } from "../goal/Goals";
import { ReportProgress } from "../goal/progress/ReportProgress";
import { GoalImplementationMapper } from "../goal/support/GoalImplementationMapper";
import { GoalSetter } from "../mapping/GoalSetter";
import { PushMapping } from "../mapping/PushMapping";
import { PushTest } from "../mapping/PushTest";
import { GoalApprovalRequestVoter } from "../registration/GoalApprovalRequestVoter";
import { MachineConfiguration } from "./MachineConfiguration";
import { SoftwareDeliveryMachineConfiguration } from "./SoftwareDeliveryMachineOptions";

/**
 * Interface for machines driven by configurable goals.
 * Goals and goal "implementations" can be defined by users.
 */
export interface GoalDrivenMachine<O extends SoftwareDeliveryMachineConfiguration> extends MachineConfiguration<O> {

    /**
     * Return the PushMapping that will be used on pushes.
     * Useful in testing goal setting.
     * @return {PushMapping<Goals>}
     */
    pushMapping: PushMapping<Goals>;

    /**
     * Provide the implementation for a goal.
     * The SDM will run it as soon as the goal is ready (all preconditions are met).
     * If you provide a PushTest, then the SDM can assign different implementations
     * to the same goal based on the code in the project.
     * @param {string} implementationName
     * @param {Goal} goal
     * @param {ExecuteGoal} goalExecutor
     * @param options PushTest to narrow matching & InterpretLog that can handle
     * the log from the goalExecutor function
     * @return {this}
     */
    addGoalImplementation(implementationName: string,
                          goal: Goal,
                          goalExecutor: ExecuteGoal,
                          options?: Partial<{
                              pushTest: PushTest,
                              logInterpreter: InterpretLog,
                              progressReporter: ReportProgress,
                          }>): this;

    /**
     * Declare that a goal will become successful based on something outside.
     * For instance, ArtifactGoal succeeds because of an ImageLink event.
     * This tells the SDM that it does not need to run anything when this
     * goal becomes ready.
     * @param {Goal} goal
     * @param {string} sideEffectName
     * @param {PushTest} pushTest
     */
    addGoalSideEffect(goal: Goal, sideEffectName: string,
                      pushTest: PushTest): this;

    readonly goalFulfillmentMapper: GoalImplementationMapper;

    /**
     * Add goal setting contributions that will be added into SDM goal setting.
     * Decorates other goal setting behavior.
     *
     * For example, always do fingerprints:
     *   sdm.addGoalContributions(onAnyPush().setGoals(FingerprintGoal))
     *
     * Or, sometimes do a custom local deploy goal:
     *   sdm.addGoalContributions(
     *       whenPushSatisfies(IsSdm, IsInLocalMode).setGoals(
     *          new Goals("delivery", LocalSdmDeliveryGoal)));
     *   sdm.addGoalImplementation("SDM CD", LocalSdmDeliveryGoal,
     *          executeLocalSdmDelivery(options)); // tell it how to execute that custom goal
     * @param goalContributions contributions to goals
     */
    addGoalContributions(goalContributions: GoalSetter): this;

    /**
     * Add vote that gets to decide whether to deny or grant goal approval requests.
     * @param vote
     */
    addGoalApprovalRequestVoter(vote: GoalApprovalRequestVoter): this;

}

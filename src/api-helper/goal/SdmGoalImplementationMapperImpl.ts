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

import { Goal } from "../../api/goal/Goal";
import { SdmGoalEvent } from "../../api/goal/SdmGoalEvent";
import { IsolatedGoalLauncher } from "../../api/goal/support/IsolatedGoalLauncher";
import {
    GoalFulfillment,
    GoalFulfillmentCallback,
    GoalImplementation,
    GoalSideEffect,
    SdmGoalImplementationMapper,
} from "../../api/goal/support/SdmGoalImplementationMapper";
import { PushListenerInvocation } from "../../api/listener/PushListener";

/**
 * Concrete implementation of SdmGoalImplementationMapper
 */
export class SdmGoalImplementationMapperImpl implements SdmGoalImplementationMapper {

    private readonly implementations: GoalImplementation[] = [];
    private readonly sideEffects: GoalSideEffect[] = [];
    private readonly callbacks: GoalFulfillmentCallback[] = [];

    constructor(private readonly goalLauncher: IsolatedGoalLauncher) {
    }

    public async findImplementationBySdmGoal(goal: SdmGoalEvent, inv: PushListenerInvocation): Promise<GoalImplementation> {
        const matchedNames = this.implementations.filter(m =>
            m.implementationName === goal.fulfillment.name &&
            m.goal.context === goal.externalKey);

        const matchedGoalImplementations = [];
        for (const implementation of matchedNames) {
            if (await implementation.pushTest.mapping(inv)) {
                matchedGoalImplementations.push(implementation);
            }
        }

        if (matchedGoalImplementations.length > 1) {
            throw new Error("Multiple mappings for name " + goal.fulfillment.name);
        }
        if (matchedGoalImplementations.length === 0) {
            throw new Error(`No implementation found with name '${goal.fulfillment.name}': ` +
                `Found ${this.implementations.map(impl => impl.implementationName)}`);
        }
        return matchedGoalImplementations[0];
    }

    public addImplementation(implementation: GoalImplementation): this {
        this.implementations.push(implementation);
        return this;
    }

    public addSideEffect(sideEffect: GoalSideEffect): this {
        this.sideEffects.push(sideEffect);
        return this;
    }

    public addFulfillmentCallback(callback: GoalFulfillmentCallback): this {
        this.callbacks.push(callback);
        return this;
    }

    public async findFulfillmentByPush(goal: Goal, inv: PushListenerInvocation): Promise<GoalFulfillment | undefined> {
        const implementationsForGoal = this.implementations.filter(m => m.goal.name === goal.name
            && m.goal.environment === goal.environment);
        for (const implementation of implementationsForGoal) {
            if (await implementation.pushTest.mapping(inv)) {
                return implementation;
            }
        }
        const knownSideEffects = this.sideEffects.filter(m => m.goal.name === goal.name
            && m.goal.environment === goal.environment);
        for (const sideEffect of knownSideEffects) {
            if (await sideEffect.pushTest.mapping(inv)) {
                return sideEffect;
            }
        }
        return undefined;
    }

    public findFulfillmentCallbackForGoal(g: SdmGoalEvent): GoalFulfillmentCallback[] {
        return this.callbacks.filter(c =>
            c.goal.name === g.name &&
            // This slice is required because environment is suffixed with /
            (c.goal.definition.environment.slice(0, -1) === g.environment
                || c.goal.definition.environment === g.environment));
    }

    public getIsolatedGoalLauncher(): IsolatedGoalLauncher {
        return this.goalLauncher;
    }
}

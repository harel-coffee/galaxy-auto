import { shallowMount } from "@vue/test-utils";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import MockConfigProvider from "components/providers/MockConfigProvider";
import flushPromises from "flush-promises";
import { getLocalVue } from "tests/jest/helpers";

import SelectionOperations from "./SelectionOperations.vue";

const localVue = getLocalVue();

const FAKE_HISTORY_ID = "fake_history_id";
const FAKE_HISTORY = { id: FAKE_HISTORY_ID, update_time: new Date() };
const BULK_OPERATIONS_ENDPOINT = new RegExp(`/api/histories/${FAKE_HISTORY_ID}/contents/bulk`);
const BULK_SUCCESS_RESPONSE = { success_count: 1, errors: [] };
const BULK_ERROR_RESPONSE = {
    success_count: 0,
    errors: [{ error: "Error reason", item: { history_content_type: "dataset", id: "dataset_id" } }],
};

const NO_TASKS_CONFIG = {
    enable_celery_tasks: false,
};
const TASKS_CONFIG = {
    enable_celery_tasks: true,
};

const getPurgedContentSelection = () => new Map([["FAKE_ID", { purged: true }]]);
const getNonPurgedContentSelection = () => new Map([["FAKE_ID", { purged: false }]]);

async function mountSelectionOperationsWrapper(config) {
    const wrapper = shallowMount(
        SelectionOperations,
        {
            propsData: {
                history: FAKE_HISTORY,
                filterText: "",
                contentSelection: new Map(),
                selectionSize: 1,
                isQuerySelection: false,
                totalItemsInQuery: 5,
            },
            stubs: {
                ConfigProvider: MockConfigProvider(config),
            },
        },
        localVue
    );
    await flushPromises();
    return wrapper;
}

describe("History Selection Operations", () => {
    let axiosMock;
    let wrapper;

    describe("With Celery Enabled", () => {
        beforeEach(async () => {
            axiosMock = new MockAdapter(axios);
            wrapper = await mountSelectionOperationsWrapper(TASKS_CONFIG);
            await flushPromises();
        });

        afterEach(() => {
            axiosMock.restore();
        });

        describe("Dropdown Menu", () => {
            it("should not render if there is nothing selected", async () => {
                await wrapper.setProps({ selectionSize: 0 });
                expect(wrapper.html()).toBe("");
            });

            it("should display the total number of items to apply the operation", async () => {
                await wrapper.setProps({ selectionSize: 10 });
                expect(wrapper.find('[data-description="selected count"]').text()).toContain("10");
            });

            it("should display 'hide' option only on visible items", async () => {
                const option = '[data-description="hide option"]';
                expect(wrapper.find(option).exists()).toBe(true);
                await wrapper.setProps({ filterText: "visible:false" });
                expect(wrapper.find(option).exists()).toBe(false);
            });

            it("should display 'unhide' option only on hidden items", async () => {
                const option = '[data-description="unhide option"]';
                expect(wrapper.find(option).exists()).toBe(false);
                await wrapper.setProps({ filterText: "visible:false" });
                expect(wrapper.find(option).exists()).toBe(true);
            });

            it("should display 'delete' option only on non-deleted items", async () => {
                const option = '[data-description="delete option"]';
                expect(wrapper.find(option).exists()).toBe(true);
                await wrapper.setProps({ filterText: "deleted:true" });
                expect(wrapper.find(option).exists()).toBe(false);
            });

            it("should display 'permanently delete' option always", async () => {
                const option = '[data-description="purge option"]';
                expect(wrapper.find(option).exists()).toBe(true);
                await wrapper.setProps({ filterText: "deleted:true" });
                expect(wrapper.find(option).exists()).toBe(true);
            });

            it("should display 'undelete' option only on deleted and non-purged items", async () => {
                const option = '[data-description="undelete option"]';
                expect(wrapper.find(option).exists()).toBe(false);
                await wrapper.setProps({
                    filterText: "deleted:true",
                    contentSelection: getNonPurgedContentSelection(),
                });
                expect(wrapper.find(option).exists()).toBe(true);
            });

            it("should not display 'undelete' when is manual selection mode and all selected items are purged", async () => {
                const option = '[data-description="undelete option"]';
                await wrapper.setProps({
                    filterText: "deleted:true",
                    contentSelection: getPurgedContentSelection(),
                    isQuerySelection: false,
                });
                expect(wrapper.find(option).exists()).toBe(false);
            });

            it("should display 'undelete' option when is query selection mode and filtering by deleted", async () => {
                const option = '[data-description="undelete option"]';
                // In query selection mode we don't know if some items may not be purged, so we allow to undelete
                await wrapper.setProps({
                    filterText: "deleted:true",
                    contentSelection: getPurgedContentSelection(),
                    isQuerySelection: true,
                });
                expect(wrapper.find(option).exists()).toBe(true);
            });

            it("should display collection building options only on visible and non-deleted items", async () => {
                const buildListOption = '[data-description="build list"]';
                const buildPairOption = '[data-description="build pair"]';
                const buildListOfPairsOption = '[data-description="build list of pairs"]';
                expect(wrapper.find(buildListOption).exists()).toBe(true);
                expect(wrapper.find(buildPairOption).exists()).toBe(true);
                expect(wrapper.find(buildListOfPairsOption).exists()).toBe(true);
                await wrapper.setProps({ filterText: "visible:false" });
                expect(wrapper.find(buildListOption).exists()).toBe(false);
                expect(wrapper.find(buildPairOption).exists()).toBe(false);
                expect(wrapper.find(buildListOfPairsOption).exists()).toBe(false);
                await wrapper.setProps({ filterText: "deleted:true" });
                expect(wrapper.find(buildListOption).exists()).toBe(false);
                expect(wrapper.find(buildPairOption).exists()).toBe(false);
                expect(wrapper.find(buildListOfPairsOption).exists()).toBe(false);
            });

            it("should display list building option when all are selected", async () => {
                const buildListOption = '[data-description="build list all"]';
                await wrapper.setProps({ selectionSize: 105 });
                await wrapper.setProps({ totalItemsInQuery: 105 });
                await wrapper.setProps({ isQuerySelection: true });
                expect(wrapper.find(buildListOption).exists()).toBe(true);
            });
        });

        describe("Operation Run", () => {
            it("should emit event to disable selection", async () => {
                axiosMock.onPut(BULK_OPERATIONS_ENDPOINT).reply(200, BULK_SUCCESS_RESPONSE);

                expect(wrapper.emitted()).not.toHaveProperty("update:show-selection");
                wrapper.vm.hideSelected();
                await flushPromises();
                expect(wrapper.emitted()).toHaveProperty("update:show-selection");
                expect(wrapper.emitted()["update:show-selection"][0][0]).toBe(false);
            });

            it("should update operation-running state when running any operation that succeeds", async () => {
                axiosMock.onPut(BULK_OPERATIONS_ENDPOINT).reply(200, BULK_SUCCESS_RESPONSE);

                expect(wrapper.emitted()).not.toHaveProperty("update:operation-running");
                wrapper.vm.hideSelected();
                await flushPromises();
                expect(wrapper.emitted()).toHaveProperty("update:operation-running");

                const operationRunningEvents = wrapper.emitted("update:operation-running");
                expect(operationRunningEvents).toHaveLength(1);
                // The event sets the current History update time for waiting until the next history update
                expect(operationRunningEvents[0]).toEqual([FAKE_HISTORY.update_time]);
            });

            it("should update operation-running state to null when the operation fails", async () => {
                axiosMock.onPut(BULK_OPERATIONS_ENDPOINT).reply(400);

                expect(wrapper.emitted()).not.toHaveProperty("update:operation-running");
                wrapper.vm.hideSelected();
                await flushPromises();
                expect(wrapper.emitted()).toHaveProperty("update:show-selection");

                const operationRunningEvents = wrapper.emitted("update:operation-running");
                // We expect 2 events, one before running the operation and another one after completion
                expect(operationRunningEvents).toHaveLength(2);
                // The first event sets the current History update time for waiting until the next history update
                expect(operationRunningEvents[0]).toEqual([FAKE_HISTORY.update_time]);
                // The second is null to signal that we shouldn't wait for a history change anymore since the operation has failed
                expect(operationRunningEvents[1]).toEqual([null]);
            });

            it("should emit operation error event when the operation fails", async () => {
                axiosMock.onPut(BULK_OPERATIONS_ENDPOINT).reply(400);

                expect(wrapper.emitted()).not.toHaveProperty("operation-error");
                wrapper.vm.hideSelected();
                await flushPromises();
                expect(wrapper.emitted()).toHaveProperty("operation-error");
            });

            it("should emit operation error event with the result when any item fail", async () => {
                axiosMock.onPut(BULK_OPERATIONS_ENDPOINT).reply(200, BULK_ERROR_RESPONSE);

                expect(wrapper.emitted()).not.toHaveProperty("operation-error");
                wrapper.vm.hideSelected();
                await flushPromises();
                expect(wrapper.emitted()).toHaveProperty("operation-error");

                const operationErrorEvents = wrapper.emitted("operation-error");
                expect(operationErrorEvents).toHaveLength(1);
                const errorEvent = operationErrorEvents[0][0];
                expect(errorEvent).toHaveProperty("result");
                expect(errorEvent.result).toEqual(BULK_ERROR_RESPONSE);
            });
        });
    });

    describe("With Celery Disabled", () => {
        beforeEach(async () => {
            axiosMock = new MockAdapter(axios);
            wrapper = await mountSelectionOperationsWrapper(NO_TASKS_CONFIG);
            await flushPromises();
        });

        afterEach(() => {
            axiosMock.restore();
        });

        describe("Dropdown Menu", () => {
            it("should hide `Change data type` option", async () => {
                const option = '[data-description="change data type"]';
                expect(wrapper.find(option).exists()).toBe(false);
            });
        });
    });
});

<template>
    <div contenteditable="true" @input="inputEvent">{{value}}</div>
</template>
<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class EditableDiv extends Vue {
    @Prop({ type: String, default: '' }) value!: string

    inputEvent(): void {
        this.$emit('input', this.$el.textContent)
    }
}
</script>
